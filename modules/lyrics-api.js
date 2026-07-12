export const csvSongs = [];
// RFC-compliant safe CSV parser
export function parseCSV(text) {
  const lines = [];
  let row = [""];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i+1];
    
    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push("");
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') {
        i++;
      }
      if (row.length > 1 || row[0] !== "") {
        lines.push(row);
      }
      row = [""];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }
  return lines;
}

// Convert CSV rows to structured track metadata index
export function loadCSVSongs(csvText) {
  try {
    const parsedRows = parseCSV(csvText);
    if (parsedRows.length <= 1) return;
    
    const header = parsedRows[0];
    const songIdx = header.indexOf('Song');
    const artistIdx = header.indexOf('Artist');
    const genresIdx = header.indexOf('Parent Genres') !== -1 ? header.indexOf('Parent Genres') : header.indexOf('Genres');
    const spotifyIdIdx = header.indexOf('Spotify Track Id');
    
    if (songIdx === -1 || artistIdx === -1) {
      console.warn("Invalid CSV structure. Missing Song or Artist columns.");
      return;
    }
    
    csvSongs.length = 0;
    
    for (let i = 1; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      if (row.length < Math.max(songIdx, artistIdx)) continue;
      
      const songTitle = row[songIdx];
      const artistName = row[artistIdx];
      if (!songTitle || !artistName) continue;
      
      const spotifyId = spotifyIdIdx !== -1 ? row[spotifyIdIdx] : '';
      const genre = genresIdx !== -1 ? row[genresIdx] : 'Pop';
      const cleanGenre = genre.split(',')[0].trim() || 'Music';
      
      const id = 'csv-' + i;
      
      let art = 'M';
      if (artistName) {
        const parts = artistName.split(' ');
        art = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
      }
      
      csvSongs.push({
        id,
        title: songTitle,
        artist: artistName,
        spotifyId,
        genre: cleanGenre,
        art
      });
    }
    console.log(`[CSV Loader] Successfully parsed ${csvSongs.length} songs from CSV.`);
  } catch (error) {
    console.error("Error loading CSV songs:", error);
  }
}

// Help clean artist/title to avoid search misses
export function cleanQueryTerm(term) {
  return term
    .replace(/\s*-\s*(Remastered|Remaster|Live|Single|Acoustic|Radio Edit|EP Version|Album Version|Bonus Track).*$/i, '')
    .replace(/\s*\(feat\..*?\)/i, '')
    .replace(/\s*\(with\s.*?\)/i, '')
    .replace(/\s*\(Remastered\)/i, '')
    .replace(/\s*\(Live\)/i, '')
    .trim();
}

// Fetch official lyrics dynamically with LRCLIB & Lyrics.ovh fallbacks
// Fetch official lyrics dynamically with multiple fallback providers including Genius & AI
export async function fetchLyrics(artist, title) {
  const cleanArtist = cleanQueryTerm(artist);
  const cleanTitle = cleanQueryTerm(title);
  
  console.log(`[Lyrics Fetch] Searching lyrics for: "${cleanArtist} - ${cleanTitle}" (Original: "${artist} - ${title}")`);
  
  // 1. Try LRCLIB exact lookup
  try {
    const url = `https://lrclib.net/api/lookup?artist=${encodeURIComponent(cleanArtist)}&track=${encodeURIComponent(cleanTitle)}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data && data.plainLyrics) {
        console.log("[Lyrics Fetch] Found exact plain lyrics on LRCLIB");
        return data.plainLyrics;
      } else if (data && data.syncedLyrics) {
        console.log("[Lyrics Fetch] Found exact synced lyrics on LRCLIB");
        return data.syncedLyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();
      }
    }
  } catch (err) {
    console.warn("[Lyrics Fetch] LRCLIB exact lookup failed:", err);
  }
  
  // 2. Try LRCLIB fuzzy search using specific track & artist names
  try {
    const url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
    const response = await fetch(url);
    if (response.ok) {
      const results = await response.json();
      if (results && results.length > 0) {
        // Find first item with lyrics
        const bestMatch = results.find(item => item.plainLyrics || item.syncedLyrics);
        if (bestMatch) {
          console.log("[Lyrics Fetch] Found lyrics via LRCLIB fuzzy search (by signature)");
          if (bestMatch.plainLyrics) return bestMatch.plainLyrics;
          return bestMatch.syncedLyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();
        }
      }
    }
  } catch (err) {
    console.warn("[Lyrics Fetch] LRCLIB fuzzy signature search failed:", err);
  }

  // 3. Try LRCLIB search with a single text query (very robust for typos/slight differences)
  try {
    const url = `https://lrclib.net/api/search?q=${encodeURIComponent(cleanArtist + ' ' + cleanTitle)}`;
    const response = await fetch(url);
    if (response.ok) {
      const results = await response.json();
      if (results && results.length > 0) {
        const bestMatch = results.find(item => item.plainLyrics || item.syncedLyrics);
        if (bestMatch) {
          console.log("[Lyrics Fetch] Found lyrics via LRCLIB text search (by q)");
          if (bestMatch.plainLyrics) return bestMatch.plainLyrics;
          return bestMatch.syncedLyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();
        }
      }
    }
  } catch (err) {
    console.warn("[Lyrics Fetch] LRCLIB fuzzy text search failed:", err);
  }
  
  // 4. Try Lyrics.ovh API
  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data && data.lyrics) {
        console.log("[Lyrics Fetch] Found lyrics on Lyrics.ovh");
        return data.lyrics;
      }
    }
  } catch (err) {
    console.warn("[Lyrics Fetch] Lyrics.ovh lookup failed:", err);
  }

  // 5. Try Genius (via AllOrigins CORS-proxy + DOMParser Scraper)
  try {
    console.log("[Lyrics Fetch] Attempting Genius lookup...");
    const geniusLyrics = await fetchGeniusLyrics(cleanArtist, cleanTitle);
    if (geniusLyrics) {
      console.log("[Lyrics Fetch] Successfully scraped lyrics from Genius!");
      return geniusLyrics;
    }
  } catch (err) {
    console.warn("[Lyrics Fetch] Genius lookup failed:", err);
  }

  // 6. Try Gemini AI Lyrics Searcher (Ultimate Fallback)
  try {
    const currentApiKey = typeof getAPIKey === 'function' ? getAPIKey() : null;
    if (currentApiKey) {
      console.log("[Lyrics Fetch] Attempting AI Lyrics Generator fallback...");
      const aiLyrics = await fetchAILyrics(artist, title);
      if (aiLyrics) {
        return aiLyrics;
      }
    }
  } catch (err) {
    console.warn("[Lyrics Fetch] AI Lyrics Generator failed:", err);
  }
  
  throw new Error("Could not find lyrics in any open database (LRCLIB, Lyrics.ovh), Genius, or via AI.");
}

// Genius lyrics scraper using AllOrigins CORS proxy
async function fetchGeniusLyrics(artist, title) {
  const searchUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://genius.com/api/search/multi?q=${encodeURIComponent(artist + ' ' + title)}`)}`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) throw new Error("Genius search proxy failed");
  const searchData = await searchRes.json();
  const parsedData = JSON.parse(searchData.contents);
  
  // Find the first hit in the "song" section
  const songSection = parsedData.response.sections.find(s => s.type === 'song');
  if (!songSection || !songSection.hits || songSection.hits.length === 0) {
    throw new Error("No Genius matches found");
  }
  
  const hit = songSection.hits[0].result;
  const songPath = hit.path;
  console.log(`[Genius Scraper] Found Genius path: ${songPath}`);
  
  // Fetch HTML from Genius song page
  const lyricUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://genius.com${songPath}`)}`;
  const lyricRes = await fetch(lyricUrl);
  if (!lyricRes.ok) throw new Error("Genius lyrics page proxy failed");
  const lyricData = await lyricRes.json();
  const html = lyricData.contents;
  
  // Parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Scrape lyrics containers
  const containers = doc.querySelectorAll('div[data-lyrics-container="true"]');
  let lyricsText = "";
  
  if (containers.length > 0) {
    containers.forEach(container => {
      // Replace <br> tags with actual newlines to preserve styling safely
      container.querySelectorAll('br').forEach(br => {
        if (br.parentNode) {
          br.parentNode.insertBefore(doc.createTextNode('\n'), br);
          br.parentNode.removeChild(br);
        }
      });
      lyricsText += container.textContent + "\n\n";
    });
  } else {
    // Legacy fallback class
    const oldContainer = doc.querySelector('.lyrics');
    if (oldContainer) {
      lyricsText = oldContainer.textContent;
    }
  }
  
  lyricsText = lyricsText.trim();
  if (lyricsText) {
    // Sanitize extra consecutive empty lines
    lyricsText = lyricsText.replace(/\n{3,}/g, '\n\n');
    return lyricsText;
  }
  throw new Error("Lyrics content not found in Genius page structure");
}

// AI Lyrics Generator (Ultimate Fallback)
async function fetchAILyrics(artist, title) {
  const currentApiKey = typeof getAPIKey === 'function' ? getAPIKey() : null;
  if (!currentApiKey) {
    throw new Error("API key is not configured for AI fallback");
  }
  
  const prompt = `You are a lyrics repository. Retrieve and return ONLY the complete authentic English lyrics of the song "${title}" by artist "${artist}". Do not write any explanations, headers, translations, or notes. Just output the clean lines of the song.`;
  
  let lyricsText = "";
  
  if (currentApiKey.startsWith('sk-or-')) {
    // OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }]
      })
    });
    
    if (response.ok) {
      const resJson = await response.json();
      lyricsText = resJson.choices[0].message.content;
    }
  } else {
    // Google Gemini API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${currentApiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      })
    });
    
    if (response.ok) {
      const resJson = await response.json();
      lyricsText = resJson.candidates[0].content.parts[0].text;
    }
  }
  
  lyricsText = lyricsText.trim();
  // Strip Markdown code fences if any
  lyricsText = lyricsText.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
  
  if (lyricsText && lyricsText.length > 100) {
    return lyricsText;
  }
  throw new Error("AI returned empty or invalid text");
}

// Group song lines into semantic 3-4 line stanzas
export function segmentLyricsIntoStanzas(rawLyrics) {
  let cleaned = rawLyrics
    .replace(/\r\n/g, '\n')
    .replace(/Paroles de .* par .*/gi, '')
    .replace(/Lyrics by .* published by .*/gi, '')
    .trim();
  
  // Helper to identify structural label lines like [Chorus], (chorus), [Verse 1], etc.
  const isStructuralLabel = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    return /^[\[\(]\s*(chorus|verse|bridge|intro|outro|solo|refrain|pre-chorus|prechorus|instrumental|transition|guitar|куплет|припев|интро|coda|hook|snippet|part\s*\d+|bridge\s*\d+|chorus\s*\d+|verse\s*\d+|куплет\s*\d+|припев\s*\d+)/i.test(trimmed);
  };

  // 1. Split raw text into initial semantic blocks based on double newlines
  let initialBlocks = [];
  if (cleaned.includes('\n\n')) {
    initialBlocks = cleaned.split('\n\n');
  } else {
    initialBlocks = [cleaned];
  }
  
  let blocks = [];
  
  initialBlocks.forEach(block => {
    // Split block into individual lines, strip leading/trailing spaces, and filter structural markers
    const lines = block.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !isStructuralLabel(line));
      
    if (lines.length === 0) return;
    
    // 2. If a single block has more than 5 lines, partition it into standard chunks of 3-4 lines
    if (lines.length > 5) {
      const chunkSize = 4;
      for (let i = 0; i < lines.length; i += chunkSize) {
        const chunk = lines.slice(i, i + chunkSize).join('\n');
        if (chunk) blocks.push(chunk);
      }
    } else {
      blocks.push(lines.join('\n'));
    }
  });
  
  const finalLines = [];
  let blockIndex = 1;
  
  blocks.forEach(block => {
    const text = block.trim();
    if (!text) return;
    
    finalLines.push({
      id: `dyn-${blockIndex}`,
      text: text,
      translation: "",
      grammar: [],
      words: []
    });
    blockIndex++;
  });
  
  return finalLines;
}


// Backward Compatibility
window.parseCSV = parseCSV;
window.loadCSVSongs = loadCSVSongs;
window.cleanQueryTerm = cleanQueryTerm;
window.fetchLyrics = fetchLyrics;
window.segmentLyricsIntoStanzas = segmentLyricsIntoStanzas;
window.csvSongs = csvSongs;