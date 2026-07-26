// @ts-check
/// <reference path="./types.js" />
/**
 * ============================================================================
 * AI LYRIC-TRAINER - DICTIONARY STATISTICS MODULE
 * Handles activity heatmap, weekly chart, daily streaks, and date formatting.
 * @AI-SECTION: DICTIONARY_STATS
 * ============================================================================
 */

// Helper to get local date string YYYY-MM-DD
function getLocalISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Record an activity log entry for the heatmap
function recordActivity(points = 1) {
  try {
    const today = getLocalISODate(new Date()); // "YYYY-MM-DD" in local time
    const activityStr = localStorage.getItem('dictionary_activity') || '{}';
    const activityObj = JSON.parse(activityStr);
    activityObj[today] = (activityObj[today] || 0) + points;
    localStorage.setItem('dictionary_activity', JSON.stringify(activityObj));
    renderHeatmap();
  } catch (e) {
    console.error("Failed to record heatmap activity:", e);
  }
}

// AUTO-FIX: Restore streaks broken by the UTC to Local Timezone transition AND Firebase rollback
(function fixTimezoneStreakGap() {
  try {
    if (localStorage.getItem('streak_tz_fixed_v2')) return;
    const activityStr = localStorage.getItem('dictionary_activity');
    if (!activityStr) return;
    
    const activityObj = JSON.parse(activityStr);
    let hasChanges = false;
    const today = new Date();
    
    // We forcefully grant activity for the last 5 days to compensate for the Firebase cloud rollback bug
    for (let i = 0; i <= 5; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const localDate = getLocalISODate(d);
        
        if (!activityObj[localDate] || activityObj[localDate] === 0) {
            activityObj[localDate] = 1; // Grant 1 minimum review point to bridge the lost days
            hasChanges = true;
        }
    }

    if (hasChanges) {
      localStorage.setItem('dictionary_activity', JSON.stringify(activityObj));
      console.debug("[Auto-Fix] Forcefully restored missing streak days lost to Firebase rollback.");
    }
    localStorage.setItem('streak_tz_fixed_v2', 'true');
  } catch (e) {
    console.error("Timezone streak fix failed", e);
  }
})();

// Calculate daily consecutive study streak count
function getDailyStreak() {
  try {
    const activityStr = localStorage.getItem('dictionary_activity') || '{}';
    const activityObj = JSON.parse(activityStr);
    
    let streak = 0;
    let checkDate = new Date();
    
    while (true) {
      const dateStr = getLocalISODate(checkDate);
      if (activityObj[dateStr] && activityObj[dateStr] > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        if (streak === 0) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = getLocalISODate(yesterday);
          if (activityObj[yesterdayStr] && activityObj[yesterdayStr] > 0) {
            checkDate = yesterday;
            continue;
          }
        }
        break;
      }
    }
    return streak;
  } catch (e) {
    return 0;
  }
}

// Render dynamic 28-day Activity Grid Heatmap
function renderHeatmap() {
  const gridEl = document.getElementById('dictHeatmapGrid');
  const streakEl = document.getElementById('dictStreakInfo');
  if (!gridEl) return;

  gridEl.innerHTML = '';
  
  const streakCount = getDailyStreak();
  if (streakEl) {
    streakEl.textContent = `Дней подряд: ${streakCount} ${getStreakWordForm(streakCount)}`;
  }
  
  const activityStr = localStorage.getItem('dictionary_activity') || '{}';
  const activityObj = JSON.parse(activityStr);
  
  const dates = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d);
  }
  
  dates.forEach(date => {
    const dateStr = getLocalISODate(date);
    const count = activityObj[dateStr] || 0;
    
    let intensity = 0;
    if (count > 0) {
      if (count <= 2) intensity = 1;
      else if (count <= 5) intensity = 2;
      else intensity = 3;
    }
    
    const cell = document.createElement('div');
    cell.className = `heatmap-cell intensity-${intensity}`;
    
    const readableDate = formatDateRu(date);
    cell.setAttribute('data-tooltip', `${readableDate}: ${count} ${getReviewWordForm(count)}`);
    
    gridEl.appendChild(cell);
  });
}

function formatDateRu(date) {
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

function getStreakWordForm(count) {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'дней';
  if (lastDigit === 1) return 'день';
  if (lastDigit >= 2 && lastDigit <= 4) return 'дня';
  return 'дней';
}

function getReviewWordForm(count) {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'повторений';
  if (lastDigit === 1) return 'повторение';
  if (lastDigit >= 2 && lastDigit <= 4) return 'повторения';
  return 'повторений';
}

// Render 7-day added words bar chart
function renderDictWeekChart() {
  const chartContainer = document.getElementById('dictWeekChart');
  if (!chartContainer) return;
  // Clear previous content
  chartContainer.innerHTML = '';
  // Header
  const header = document.createElement('div');
  header.className = 'dwc-header';
  const title = document.createElement('span');
  title.className = 'dwc-title';
  title.textContent = 'Added за 7 дней';
  header.appendChild(title);
  chartContainer.appendChild(header);
  // Calculate counts for last 7 days
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const counts = Array(7).fill(0);
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = now - i * dayMs;
    const dayEnd = dayStart + dayMs;
    labels.push(new Date(dayStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    counts[6 - i] = personalDictionary.filter(w => w.addedAt && w.addedAt >= dayStart && w.addedAt < dayEnd).length;
  }
  // Bars wrapper
  const barWrapper = document.createElement('div');
  barWrapper.style.display = 'flex';
  barWrapper.style.alignItems = 'flex-end';
  barWrapper.style.height = '44px';
  barWrapper.style.gap = '4px';
  const maxCount = Math.max(...counts, 1);
  counts.forEach((cnt, idx) => {
    const bar = document.createElement('div');
    const heightPct = (cnt / maxCount) * 100;
    bar.style.width = '12px';
    bar.style.height = `${heightPct}%`;
    bar.style.background = 'linear-gradient(180deg, #1db954, #0a7d3e)';
    bar.title = `${labels[idx]}: ${cnt} слово${cnt !== 1 ? 'а' : ''}`;
    barWrapper.appendChild(bar);
  });
  chartContainer.appendChild(barWrapper);
  // Labels
  const labelWrapper = document.createElement('div');
  labelWrapper.style.display = 'flex';
  labelWrapper.style.justifyContent = 'space-between';
  labelWrapper.style.marginTop = '4px';
  labels.forEach(lbl => {
    const span = document.createElement('span');
    span.style.fontSize = '10px';
    span.style.color = '#666';
    span.textContent = lbl;
    labelWrapper.appendChild(span);
  });
  chartContainer.appendChild(labelWrapper);
}
