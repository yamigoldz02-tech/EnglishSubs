/**
 * @AI-SECTION: SYNC_MANAGER_FIREBASE
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc 
} from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

// Reusing your exact credentials from bestdog for project bestdog-fb34c
const firebaseConfig = {
  apiKey: "AIzaSyARiuqiPVzKWuCQFqushFjj30gWwk02VFc",
  authDomain: "bestdog-fb34c.firebaseapp.com",
  projectId: "bestdog-fb34c",
  storageBucket: "bestdog-fb34c.firebasestorage.app",
  messagingSenderId: "971181096994",
  appId: "1:971181096994:web:2c5a8d141b5f3b125c0a7b",
  measurementId: "G-46127X6WLL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// State variables
const authListeners = [];
let currentUser = null;
let syncTimeout = null;
let isApplyingCloudData = false;

// Exclusion list for large/temporary keys we do NOT want to sync to the database
const EXCLUDED_KEYS = [
    'song_metadata_cache',
    'last_sync_timestamp',
    'last_sync_payload',
    'sync_manager_override_uid',
    'study_session_queue',
    'study_session_history',
    'study_session_learned',
    'study_session_total_count'
];

// Project Name resolver
function getProjectName() {
    const title = document.title || '';
    if (title.includes('Lyric-Trainer') || title.includes('Premium Language')) return 'EnglishSub';
    if (title.includes('Historia')) return 'Historia';
    if (title.includes('Best Dog') || title.includes('лучших пёсиков')) return 'bestdog';
    if (title.includes('AURA Tier List') || title.includes('Tir List')) return 'Tir List';
    if (title.includes('Spotify')) return 'SpotifyAnalyzer';
    if (title.includes('Random') || title.includes('Рандомайзер')) return 'Randomaizer';
    if (title.includes('Мультивселенная')) return 'default';

    let projectName = 'default';
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (window.location.protocol === 'file:') {
        const idx = pathParts.findIndex(p => p.toLowerCase().endsWith('.html'));
        if (idx > 0) projectName = pathParts[idx - 1];
    } else if (pathParts.length > 0) {
        projectName = pathParts[0];
        if (projectName.endsWith('.html')) projectName = 'default';
    }
    return projectName;
}

function shouldExclude(key) {
    if (EXCLUDED_KEYS.includes(key)) return true;
    if (key.startsWith('lyric_cache_')) return true;
    if (key.startsWith('analysis_')) return true;
    if (key.startsWith('last_sync_timestamp')) return true;
    if (key.startsWith('last_sync_payload')) return true;
    if (key.includes('cache')) return true;
    return false;
}

// Transparently Intercept LocalStorage Operations
const originalSetItem = localStorage.setItem;
const originalRemoveItem = localStorage.removeItem;

localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    if (!isApplyingCloudData && !shouldExclude(key)) {
        scheduleCloudSync();
    }
};

localStorage.removeItem = function(key) {
    originalRemoveItem.apply(this, arguments);
    if (!isApplyingCloudData && !shouldExclude(key)) {
        scheduleCloudSync();
    }
};

// Returns active sync user (either Google account or override sync code)
function getSyncUser() {
    if (currentUser) return currentUser;
    
    const overrideUid = localStorage.getItem('sync_manager_override_uid');
    if (overrideUid) {
        return {
            uid: overrideUid,
            displayName: "Linked Account",
            photoURL: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
            isOverride: true
        };
    }
    return null;
}

let lastNoticeTime = 0;
function showSyncNotice(msg, isError = false) {
    if (isError) {
        const now = Date.now();
        if (now - lastNoticeTime < 30000) return; // Debounce error toasts to once per 30 seconds
        lastNoticeTime = now;
    }
    console[isError ? 'warn' : 'log']('[SyncManager Notice]', msg);
    
    try {
        let container = document.getElementById('syncToastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'syncToastContainer';
            container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 100000; display: flex; flex-direction: column; gap: 8px; pointer-events: none;';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.style.cssText = `background: ${isError ? 'rgba(239, 68, 68, 0.95)' : 'rgba(29, 185, 84, 0.95)'}; color: #fff; font-size: 0.8rem; font-weight: 600; padding: 10px 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); pointer-events: auto; transition: opacity 0.5s ease; font-family: sans-serif;`;
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    } catch (e) { /* ignore DOM errors */ }
}

// Schedule cloud write with debounce
function scheduleCloudSync() {
    const user = getSyncUser();
    if (!user) return;
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
        syncTimeout = null;
        await pushLocalToCloud();
    }, 2000);
}

// Push local storage payload to Cloud Firestore
async function pushLocalToCloud() {
    const user = getSyncUser();
    if (!user) return;
    
    // Compile payload
    const payload = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!shouldExclude(key)) {
            payload[key] = localStorage.getItem(key);
        }
    }

    try {
        const timestamp = new Date().toISOString();
        const projectName = getProjectName();
        
        const userDocRef = doc(db, 'users', user.uid, 'sync_' + projectName, 'localStorage');
        
        await setDoc(userDocRef, {
            updatedAt: timestamp,
            payload: payload
        });
        
        // Save timestamp and payload locally to prevent self-triggering updates
        originalSetItem.call(localStorage, 'last_sync_timestamp_' + projectName, timestamp);
        originalSetItem.call(localStorage, 'last_sync_payload_' + projectName, JSON.stringify(payload));
        console.log('[SyncManager] Cloud backup successfully completed at:', timestamp);
    } catch (e) {
        console.error('[SyncManager] Failed to back up data to Cloud:', e);
        showSyncNotice('Синхронизация оффлайн или ошибка облака: ' + (e.message || e), true);
    }
}

// Smart merge function for JSON array data (specifically dictionaries)
function mergeDictionaries(localArr, cloudArr) {
    const merged = [...localArr];
    cloudArr.forEach(cloudWord => {
        if (!cloudWord || typeof cloudWord.word !== 'string') return; // Safe check
        const localIndex = merged.findIndex(w => w && typeof w.word === 'string' && w.word.toLowerCase() === cloudWord.word.toLowerCase());
        if (localIndex === -1) {
            merged.push(cloudWord);
        } else {
            // Keep the one with the higher learning level or more progress
            const localWord = merged[localIndex];
            const localLevel = localWord.level || 0;
            const cloudLevel = cloudWord.level || 0;
            if (cloudLevel > localLevel) {
                merged[localIndex] = cloudWord;
            }
        }
    });
    return merged;
}

// Smart merge for simple ID arrays (e.g. watched videos) — takes the UNION of both
function mergeIdArrays(localArr, cloudArr) {
    const merged = [...localArr];
    cloudArr.forEach(id => {
        if (typeof id === 'string' && !merged.includes(id)) {
            merged.push(id);
        }
    });
    return merged;
}

// Keys containing JSON arrays of IDs that must be merged as a UNION (never overwritten)
const UNION_ARRAY_KEYS = ['galaxy_watched_videos'];

// Keys containing text/notes that must keep the longest version to avoid data loss
const TEXT_MERGE_KEYS = ['user_notebook_text', 'galaxy_lesson_notes', 'galaxy_custom_note_folders'];

// Smart merge of local and cloud storage payloads (used on first sync)
function mergePayloads(localPayload, cloudPayload) {
    const merged = { ...localPayload };
    for (const [key, cloudVal] of Object.entries(cloudPayload)) {
        if (merged[key] === undefined) {
            // Key doesn't exist locally, take from cloud
            merged[key] = cloudVal;
        } else if (key === 'personal_dictionary') {
            // Merge word objects with smart level-aware logic
            try {
                const localArr = JSON.parse(merged[key]);
                const cloudArr = JSON.parse(cloudVal);
                if (Array.isArray(localArr) && Array.isArray(cloudArr)) {
                    merged[key] = JSON.stringify(mergeDictionaries(localArr, cloudArr));
                } else {
                    merged[key] = cloudVal; // fallback
                }
            } catch(e) {
                merged[key] = cloudVal; // fallback
            }
        } else if (UNION_ARRAY_KEYS.includes(key)) {
            // Merge ID arrays as UNION — local progress is NEVER lost
            try {
                const localArr = JSON.parse(merged[key]);
                const cloudArr = JSON.parse(cloudVal);
                if (Array.isArray(localArr) && Array.isArray(cloudArr)) {
                    merged[key] = JSON.stringify(mergeIdArrays(localArr, cloudArr));
                    console.log(`[SyncManager] Merged '${key}': local=${localArr.length}, cloud=${cloudArr.length}, result=${JSON.parse(merged[key]).length}`);
                } else {
                    // Keep whichever is longer to avoid data loss
                    merged[key] = (merged[key] || '').length >= (cloudVal || '').length ? merged[key] : cloudVal;
                }
            } catch(e) {
                // On parse error keep local value (safer)
                console.warn(`[SyncManager] Could not merge '${key}', keeping local value:`, e);
            }
        } else if (TEXT_MERGE_KEYS.includes(key)) {
            // Keep whichever string is longer to avoid losing typed notes
            merged[key] = (merged[key] || '').length >= (cloudVal || '').length ? merged[key] : cloudVal;
        } else {
            // For simple keys (like configs/theme preferences), let cloud win by default
            merged[key] = cloudVal;
        }
    }
    return merged;
}

// Pull cloud payload and apply to local storage
async function pullCloudToLocal(user) {
    try {
        const projectName = getProjectName();
        const userDocRef = doc(db, 'users', user.uid, 'sync_' + projectName, 'localStorage');
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
            const cloudData = docSnap.data();
            const cloudTimestamp = cloudData.updatedAt;
            const cloudPayload = cloudData.payload || {};
            
            const localTimestamp = localStorage.getItem('last_sync_timestamp_' + projectName) || '';
            
            // Compile local payload for possible merge or push
            const localPayload = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!shouldExclude(key)) {
                    localPayload[key] = localStorage.getItem(key);
                }
            }

            if (!localTimestamp) {
                // First sync ever on this device!
                console.log('[SyncManager] Initializing first sync on this device...');
                let hasLocalData = false;
                try {
                    const localDictStr = localStorage.getItem('personal_dictionary');
                    hasLocalData = localDictStr && JSON.parse(localDictStr).length > 0;
                } catch(err) {}
                
                if (hasLocalData) {
                    // We have important unsynced local data! Merge it with cloud payload to prevent loss
                    console.log('[SyncManager] Merging offline local dictionary with cloud backup...');
                    const mergedPayload = mergePayloads(localPayload, cloudPayload);
                    
                    isApplyingCloudData = true;
                    // Clear and apply merged payload
                    // Avoid wiping all localStorage! Only remove what we know we should
                    for (const [key, value] of Object.entries(mergedPayload)) {
                        originalSetItem.call(localStorage, key, value);
                    }
                    isApplyingCloudData = false;
                    
                    // Immediately push the merged data back to the cloud
                    console.log('[SyncManager] Pushing merged data back to Cloud...');
                    await pushLocalToCloud();
                    
                    console.log('[SyncManager] Initial merge and sync complete! Reloading page to apply updates...');
                    setTimeout(() => {
                        window.location.reload();
                    }, 800);
                } else {
                    // No local dictionary, safe to blindly write cloud payload
                    console.log('[SyncManager] Local dictionary is empty. Applying cloud data directly...');
                    isApplyingCloudData = true;
                    for (const [key, value] of Object.entries(cloudPayload)) {
                        originalSetItem.call(localStorage, key, value);
                    }
                    originalSetItem.call(localStorage, 'last_sync_timestamp_' + projectName, cloudTimestamp);
                    originalSetItem.call(localStorage, 'last_sync_payload_' + projectName, JSON.stringify(cloudPayload));
                    isApplyingCloudData = false;
                    
                    console.log('[SyncManager] Initial sync complete! Reloading page to apply updates...');
                    setTimeout(() => {
                        window.location.reload();
                    }, 800);
                }
            } else if (new Date(cloudTimestamp) > new Date(localTimestamp)) {
                // Cloud is newer than local
                console.log('[SyncManager] Newer cloud backup found! Applying changes to local storage...', cloudTimestamp);
                
                isApplyingCloudData = true;
                
                try {
                    // Safely merge local and cloud payloads to prevent accidental loss of offline-added words
                    const safeMergedPayload = mergePayloads(localPayload, cloudPayload);
                    
                    // Only clear out items that were deleted from the cloud since last sync
                    const lastSyncPayloadStr = localStorage.getItem('last_sync_payload_' + projectName);
                    let lastSyncPayload = {};
                    if (lastSyncPayloadStr) {
                        try { lastSyncPayload = JSON.parse(lastSyncPayloadStr); } catch(e) {}
                    }
                    
                    const keysToRemove = [];
                    for (const key of Object.keys(lastSyncPayload)) {
                        if (!(key in cloudPayload) && localPayload[key] === lastSyncPayload[key]) {
                            keysToRemove.push(key);
                        }
                    }
                    keysToRemove.forEach(k => originalRemoveItem.call(localStorage, k));
                    
                    // Write merged items
                    for (const [key, value] of Object.entries(safeMergedPayload)) {
                        originalSetItem.call(localStorage, key, value);
                    }
                    
                    // Write timestamps and payloads
                    originalSetItem.call(localStorage, 'last_sync_timestamp_' + projectName, cloudTimestamp);
                    originalSetItem.call(localStorage, 'last_sync_payload_' + projectName, JSON.stringify(safeMergedPayload));
                    
                    // Push back to cloud if the merge actually saved some local unsynced words
                    if (safeMergedPayload['personal_dictionary'] !== cloudPayload['personal_dictionary']) {
                        console.log('[SyncManager] Local words were safely merged with newer cloud data. Backing up...');
                        await pushLocalToCloud();
                    }
                } finally {
                    isApplyingCloudData = false;
                }
                
                console.log('[SyncManager] Sync complete! Reloading page to apply updates...');
                setTimeout(() => {
                    window.location.reload();
                }, 800);
            } else if (new Date(localTimestamp) > new Date(cloudTimestamp)) {
                // Local is newer! Push to cloud
                console.log('[SyncManager] Local storage has newer updates than cloud. Backing up to Cloud...');
                await pushLocalToCloud();
            } else {
                console.log('[SyncManager] Local storage is up to date.');
            }
        } else {
            console.log('[SyncManager] No remote data exists yet. Creating first cloud backup...');
            await pushLocalToCloud();
        }
    } catch (e) {
        console.error('[SyncManager] Sync pulling failed:', e);
        showSyncNotice('Не удалось получить данные из облака: ' + (e.message || e), true);
    }
}

// Notify all auth listeners of state change
function notifyListeners() {
    const activeUser = getSyncUser();
    for (const listener of authListeners) {
        try {
            listener(activeUser);
        } catch (e) {
            console.error('[SyncManager] Error in auth listener callback:', e);
        }
    }
}

// Handle Auth State Changes
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    
    const activeUser = getSyncUser();
    if (activeUser) {
        console.log('[SyncManager] User active:', activeUser.uid);
        await pullCloudToLocal(activeUser);
    } else {
        console.log('[SyncManager] No user logged in.');
    }
    
    notifyListeners();
});

// Centralized SyncManager Exposing API globally
window.SyncManager = {
    // Auth functions
    async signIn() {
        try {
            const result = await signInWithPopup(auth, provider);
            console.log('[SyncManager] Logged in:', result.user.displayName);
            return result.user;
        } catch (error) {
            console.error('[SyncManager] Login failed:', error);
            if (error.code === 'auth/operation-not-supported-in-this-environment') {
                alert('Вход Google не поддерживается в мобильном приложении. Пожалуйста, используйте функцию "Связать по коду".');
            } else {
                alert('Не удалось войти: ' + error.message);
            }
            throw error;
        }
    },

    async logout() {
        try {
            await signOut(auth);
            // Clear sync tokens and override UIDs
            originalRemoveItem.call(localStorage, 'sync_manager_override_uid');
            const projectName = getProjectName();
            originalRemoveItem.call(localStorage, 'last_sync_timestamp_' + projectName);
            originalRemoveItem.call(localStorage, 'last_sync_payload_' + projectName);
            console.log('[SyncManager] Logged out. Reloading to reset state...');
            window.location.reload();
        } catch (error) {
            console.error('[SyncManager] Logout failed:', error);
            throw error;
        }
    },

    onUserChanged(callback) {
        authListeners.push(callback);
        const activeUser = getSyncUser();
        callback(activeUser);
    },

    getCurrentUser() {
        return getSyncUser();
    },

    // Force synchronization manual trigger
    async forceSync(silent = false) {
        const user = getSyncUser();
        if (user) {
            console.log('[SyncManager] Forcing manual cloud sync...');
            try {
                await pullCloudToLocal(user);
                await pushLocalToCloud();
                if (!silent) {
                    alert('Синхронизация завершена успешно!');
                }
            } catch (err) {
                console.error('[SyncManager] Force sync failed:', err);
                if (!silent) {
                    alert('Ошибка при синхронизации: ' + err.message);
                }
            }
        } else {
            if (!silent) {
                alert('Вы не вошли в аккаунт.');
            }
        }
    },

    // Mobile/Cross-browser Code Sync Links
    async linkWithCode(code) {
        if (!code || code.trim().length < 5) {
            alert('Неверный код переноса!');
            return;
        }
        originalSetItem.call(localStorage, 'sync_manager_override_uid', code.trim());
        const mockUser = getSyncUser();
        if (mockUser) {
            await pullCloudToLocal(mockUser);
            alert('Устройство успешно связано по коду!');
            window.location.reload();
        }
    }
};

// On script load, check if we have an override UID and run a sync immediately!
const initialOverrideUid = localStorage.getItem('sync_manager_override_uid');
if (initialOverrideUid) {
    console.log('[SyncManager] Immediate override pull scheduled...');
    setTimeout(async () => {
        const mockUser = {
            uid: initialOverrideUid,
            displayName: "Linked Account",
            isOverride: true
        };
        await pullCloudToLocal(mockUser);
    }, 500);
}

// Mobile application lifecycle triggers
function forceSyncOnLifecycle() {
    if (syncTimeout) {
        console.log('[SyncManager] App lifecycle trigger: clearing debounce and forcing immediate cloud backup...');
        clearTimeout(syncTimeout);
        syncTimeout = null;
        pushLocalToCloud();
    }
}

// Listen to pause (Capacitor/Cordova backgrounding) and beforeunload (tab closed) events
document.addEventListener('pause', forceSyncOnLifecycle);
window.addEventListener('beforeunload', forceSyncOnLifecycle);

console.log('[SyncManager] Transparent Sync active.');
