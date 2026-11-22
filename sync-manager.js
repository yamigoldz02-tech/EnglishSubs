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
    getDoc,
    onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

// Reusing exact credentials from bestdog for project bestdog-fb34c
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
let isSyncingToCloud = false;
let pendingCloudSync = false;
let unsubscribeSnapshot = null;
let lastCloudWriteTime = 0;
const MIN_CLOUD_SYNC_INTERVAL_MS = 3000; // Responsive throttle: max 1 cloud push per 3s

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
    if (key.startsWith('galaxy_video_progress_')) return true;
    if (key.startsWith('video_progress_')) return true;
    if (key.includes('cache')) return true;
    return false;
}

function applyUpdatesLocallyWithoutReload() {
    console.log('[SyncManager] Applying cloud updates in-memory without page reload...');
    try {
        const savedDict = localStorage.getItem('personal_dictionary');
        if (savedDict) {
            try {
                window.personalDictionary = JSON.parse(savedDict);
            } catch (e) {}
        }
        if (typeof window.initDictionary === 'function') {
            window.initDictionary();
        } else {
            if (typeof window.updateSavedWordsCount === 'function') window.updateSavedWordsCount();
            if (typeof window.renderDictWordsList === 'function') window.renderDictWordsList();
            if (typeof window.populateCategorySelectors === 'function') window.populateCategorySelectors();
        }
        if (typeof window.loadCustomVerbs === 'function') {
            window.loadCustomVerbs();
        }
        if (typeof window.renderIrregularCatalog === 'function') {
            window.renderIrregularCatalog();
        }
        if (typeof window.updateIrregularStats === 'function') {
            window.updateIrregularStats();
        }
        window.dispatchEvent(new CustomEvent('cloud-sync-applied'));
    } catch (e) {
        console.warn('[SyncManager] Error updating in-memory state:', e);
    }
}

// Transparently Intercept LocalStorage Operations
const originalSetItem = localStorage.setItem;
const originalRemoveItem = localStorage.removeItem;

localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    if (!isApplyingCloudData && !shouldExclude(key)) {
        scheduleCloudSync(2000);
    }
};

localStorage.removeItem = function(key) {
    originalRemoveItem.apply(this, arguments);
    if (!isApplyingCloudData && !shouldExclude(key)) {
        scheduleCloudSync(2000);
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
        }, 3500);
    } catch (e) { /* ignore DOM errors */ }
}

// Schedule cloud write with debounce
function scheduleCloudSync(delayMs = 2000) {
    const user = getSyncUser();
    if (!user) return;
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
        syncTimeout = null;
        await pushLocalToCloud();
    }, delayMs);
}

// Push local storage payload to Cloud Firestore
async function pushLocalToCloud() {
    if (isSyncingToCloud) {
        pendingCloudSync = true;
        return;
    }
    
    const user = getSyncUser();
    if (!user) return;
    
    // Throttle writes: if last write was less than interval ago, reschedule
    const now = Date.now();
    const timeSinceLastWrite = now - lastCloudWriteTime;
    if (timeSinceLastWrite < MIN_CLOUD_SYNC_INTERVAL_MS) {
        const waitTime = MIN_CLOUD_SYNC_INTERVAL_MS - timeSinceLastWrite;
        scheduleCloudSync(waitTime);
        return;
    }

    isSyncingToCloud = true;
    
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
        
        lastCloudWriteTime = Date.now();
        
        // Save timestamp and payload locally to prevent self-triggering updates
        originalSetItem.call(localStorage, 'last_sync_timestamp_' + projectName, timestamp);
        originalSetItem.call(localStorage, 'last_sync_payload_' + projectName, JSON.stringify(payload));
        console.log('[SyncManager] Cloud backup successfully completed at:', timestamp);
    } catch (e) {
        console.error('[SyncManager] Failed to back up data to Cloud:', e);
        showSyncNotice('Синхронизация оффлайн или ошибка облака: ' + (e.message || e), true);
    } finally {
        isSyncingToCloud = false;
        if (pendingCloudSync) {
            pendingCloudSync = false;
            scheduleCloudSync(1500);
        }
    }
}

// Smart merge function for JSON array data (specifically dictionaries)
function mergeDictionaries(localArr, cloudArr) {
    if (!Array.isArray(localArr)) localArr = [];
    if (!Array.isArray(cloudArr)) return [...localArr];

    const merged = [...localArr];
    cloudArr.forEach(cloudWord => {
        if (!cloudWord || typeof cloudWord.word !== 'string') return;
        const cloudClean = cloudWord.word.trim().toLowerCase();
        const localIndex = merged.findIndex(w => w && typeof w.word === 'string' && w.word.trim().toLowerCase() === cloudClean);
        if (localIndex === -1) {
            merged.push(cloudWord);
        } else {
            const localWord = merged[localIndex];
            const localLevel = localWord.level || 0;
            const cloudLevel = cloudWord.level || 0;
            if (cloudLevel > localLevel) {
                merged[localIndex] = { ...localWord, ...cloudWord };
            } else if (cloudLevel === localLevel) {
                // Merge categories and keep highest progress
                const mergedCategories = Array.from(new Set([...(localWord.categories || []), ...(cloudWord.categories || [])]));
                const mergedCustomCategories = Array.from(new Set([...(localWord.customCategories || []), ...(cloudWord.customCategories || [])]));
                merged[localIndex] = {
                    ...localWord,
                    categories: mergedCategories.length > 0 ? mergedCategories : localWord.categories,
                    customCategories: mergedCustomCategories.length > 0 ? mergedCustomCategories : localWord.customCategories,
                    interval: Math.max(localWord.interval || 0, cloudWord.interval || 0),
                    nextReview: Math.max(localWord.nextReview || 0, cloudWord.nextReview || 0)
                };
            }
        }
    });
    return merged;
}

// Smart merge for custom irregular verbs
function mergeCustomVerbs(localArr, cloudArr) {
    if (!Array.isArray(localArr)) localArr = [];
    if (!Array.isArray(cloudArr)) return [...localArr];

    const merged = [...localArr];
    cloudArr.forEach(cloudVerb => {
        if (!cloudVerb || typeof cloudVerb.v1 !== 'string') return;
        const v1Clean = cloudVerb.v1.trim().toLowerCase();
        const exists = merged.some(v => v && typeof v.v1 === 'string' && v.v1.trim().toLowerCase() === v1Clean);
        if (!exists) {
            merged.push(cloudVerb);
        }
    });
    return merged;
}

// Smart merge for irregular verb mastery
function mergeVerbMastery(localObj, cloudObj) {
    const merged = (localObj && typeof localObj === 'object') ? { ...localObj } : {};
    if (!cloudObj || typeof cloudObj !== 'object') return merged;
    for (const [v1, cloudData] of Object.entries(cloudObj)) {
        if (!merged[v1]) {
            merged[v1] = cloudData;
        } else {
            const localData = merged[v1];
            const localStreak = localData?.streak || 0;
            const cloudStreak = cloudData?.streak || 0;
            if (cloudStreak > localStreak) {
                merged[v1] = cloudData;
            } else if (cloudStreak === localStreak) {
                const localTime = localData?.lastCorrect || 0;
                const cloudTime = cloudData?.lastCorrect || 0;
                if (cloudTime > localTime) {
                    merged[v1] = cloudData;
                }
            }
        }
    }
    return merged;
}

// Smart merge for simple ID / string arrays — takes the UNION of both
function mergeIdArrays(localArr, cloudArr) {
    const merged = Array.isArray(localArr) ? [...localArr] : [];
    if (!Array.isArray(cloudArr)) return merged;
    cloudArr.forEach(item => {
        if ((typeof item === 'string' || typeof item === 'number') && !merged.includes(item)) {
            merged.push(item);
        }
    });
    return merged;
}

// Keys containing JSON arrays of IDs / categories that must be merged as a UNION (never overwritten)
const UNION_ARRAY_KEYS = ['galaxy_watched_videos', 'personal_categories', 'personal_custom_categories'];

// Keys containing text/notes that must keep the longest version to avoid data loss
const TEXT_MERGE_KEYS = ['user_notebook_text', 'galaxy_lesson_notes', 'galaxy_custom_note_folders'];

// Smart merge of local and cloud storage payloads
function mergePayloads(localPayload, cloudPayload) {
    const merged = { ...localPayload };
    for (const [key, cloudVal] of Object.entries(cloudPayload)) {
        if (merged[key] === undefined) {
            // Key doesn't exist locally, take from cloud
            merged[key] = cloudVal;
        } else if (key === 'personal_dictionary' || key === 'my_personal_dictionary') {
            try {
                const localArr = JSON.parse(merged[key]);
                const cloudArr = JSON.parse(cloudVal);
                if (Array.isArray(localArr) && Array.isArray(cloudArr)) {
                    merged[key] = JSON.stringify(mergeDictionaries(localArr, cloudArr));
                } else {
                    merged[key] = cloudVal;
                }
            } catch (e) {
                merged[key] = cloudVal;
            }
        } else if (key === 'custom_irregular_verbs') {
            try {
                const localArr = JSON.parse(merged[key]);
                const cloudArr = JSON.parse(cloudVal);
                if (Array.isArray(localArr) && Array.isArray(cloudArr)) {
                    merged[key] = JSON.stringify(mergeCustomVerbs(localArr, cloudArr));
                } else {
                    merged[key] = cloudVal;
                }
            } catch (e) {
                merged[key] = cloudVal;
            }
        } else if (key === 'irreg_verb_mastery') {
            try {
                const localObj = JSON.parse(merged[key]);
                const cloudObj = JSON.parse(cloudVal);
                if (localObj && cloudObj) {
                    merged[key] = JSON.stringify(mergeVerbMastery(localObj, cloudObj));
                } else {
                    merged[key] = cloudVal;
                }
            } catch (e) {
                merged[key] = cloudVal;
            }
        } else if (UNION_ARRAY_KEYS.includes(key)) {
            try {
                const localArr = JSON.parse(merged[key]);
                const cloudArr = JSON.parse(cloudVal);
                if (Array.isArray(localArr) && Array.isArray(cloudArr)) {
                    merged[key] = JSON.stringify(mergeIdArrays(localArr, cloudArr));
                } else {
                    merged[key] = (merged[key] || '').length >= (cloudVal || '').length ? merged[key] : cloudVal;
                }
            } catch (e) {
                console.warn(`[SyncManager] Could not merge '${key}', keeping local value:`, e);
            }
        } else if (TEXT_MERGE_KEYS.includes(key)) {
            merged[key] = (merged[key] || '').length >= (cloudVal || '').length ? merged[key] : cloudVal;
        } else {
            // For simple preference keys, let cloud win
            merged[key] = cloudVal;
        }
    }

    // Keep personal_dictionary and my_personal_dictionary in sync
    if (merged['personal_dictionary'] && !merged['my_personal_dictionary']) {
        merged['my_personal_dictionary'] = merged['personal_dictionary'];
    } else if (merged['my_personal_dictionary'] && !merged['personal_dictionary']) {
        merged['personal_dictionary'] = merged['my_personal_dictionary'];
    }

    return merged;
}

// Safely process incoming cloud data and merge into localStorage
async function handleIncomingCloudData(cloudTimestamp, cloudPayload, currentLocalPayload = null, projName = null) {
    const projectName = projName || getProjectName();
    const localPayload = currentLocalPayload || {};
    if (!currentLocalPayload) {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!shouldExclude(key)) {
                localPayload[key] = localStorage.getItem(key);
            }
        }
    }

    isApplyingCloudData = true;
    let needsPushBack = false;

    try {
        const safeMergedPayload = mergePayloads(localPayload, cloudPayload);

        // Remove keys deleted from cloud if tracked in last sync
        const lastSyncPayloadStr = localStorage.getItem('last_sync_payload_' + projectName);
        let lastSyncPayload = {};
        if (lastSyncPayloadStr) {
            try { lastSyncPayload = JSON.parse(lastSyncPayloadStr); } catch (e) {}
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

        // Check if local had words/data that the cloud didn't have (union added new data)
        if (safeMergedPayload['personal_dictionary'] !== cloudPayload['personal_dictionary'] ||
            safeMergedPayload['custom_irregular_verbs'] !== cloudPayload['custom_irregular_verbs']) {
            needsPushBack = true;
        }

        originalSetItem.call(localStorage, 'last_sync_timestamp_' + projectName, cloudTimestamp);
        originalSetItem.call(localStorage, 'last_sync_payload_' + projectName, JSON.stringify(safeMergedPayload));
    } finally {
        isApplyingCloudData = false;
    }

    console.log('[SyncManager] Cloud data applied locally. Refreshing in-memory state & UI...');
    applyUpdatesLocallyWithoutReload();
    showSyncNotice('Данные обновлены из облака');

    if (needsPushBack) {
        console.log('[SyncManager] Local words preserved in merge, backing up unified dataset to cloud...');
        await pushLocalToCloud();
    }
}

// Pull cloud payload and apply to local storage
async function pullCloudToLocal(user, force = false) {
    try {
        const projectName = getProjectName();
        const userDocRef = doc(db, 'users', user.uid, 'sync_' + projectName, 'localStorage');
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
            const cloudData = docSnap.data();
            const cloudTimestamp = cloudData.updatedAt;
            const cloudPayload = cloudData.payload || {};
            
            const localTimestamp = localStorage.getItem('last_sync_timestamp_' + projectName) || '';
            
            // Compile local payload
            const localPayload = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!shouldExclude(key)) {
                    localPayload[key] = localStorage.getItem(key);
                }
            }

            const isCloudNewer = !localTimestamp || (new Date(cloudTimestamp) > new Date(localTimestamp));
            const shouldMerge = force || isCloudNewer || (cloudTimestamp !== localTimestamp);

            if (shouldMerge) {
                console.log('[SyncManager] Processing cloud data update...', cloudTimestamp);
                await handleIncomingCloudData(cloudTimestamp, cloudPayload, localPayload, projectName);
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

// Realtime Firestore snapshot listener for instant cross-device updates
function setupRealtimeListener(user) {
    if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
    }
    if (!user || !user.uid) return;

    const projectName = getProjectName();
    const userDocRef = doc(db, 'users', user.uid, 'sync_' + projectName, 'localStorage');

    try {
        console.log('[SyncManager] Attaching real-time Firestore listener for user:', user.uid);
        unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
            if (isSyncingToCloud) return; // Ignore snapshot events triggered while actively pushing
            if (!docSnap.exists()) return;

            const cloudData = docSnap.data();
            const cloudTimestamp = cloudData.updatedAt;
            const cloudPayload = cloudData.payload || {};
            const localTimestamp = localStorage.getItem('last_sync_timestamp_' + projectName) || '';

            // If timestamp matches local, this device originated the write — skip
            if (cloudTimestamp && cloudTimestamp === localTimestamp) return;

            console.log('[SyncManager] Real-time cloud push received from another device!', cloudTimestamp);
            handleIncomingCloudData(cloudTimestamp, cloudPayload);
        }, (error) => {
            console.warn('[SyncManager] Real-time snapshot listener notice:', error.message || error);
        });
    } catch (e) {
        console.warn('[SyncManager] Could not initialize real-time listener:', e);
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
        setupRealtimeListener(activeUser);
        await pullCloudToLocal(activeUser);
    } else {
        console.log('[SyncManager] No user logged in.');
        if (unsubscribeSnapshot) {
            unsubscribeSnapshot();
            unsubscribeSnapshot = null;
        }
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
                showSyncNotice('Вход Google не поддерживается в мобильном приложении. Пожалуйста, используйте функцию "Связать устройство".', true);
            } else {
                showSyncNotice('Не удалось войти: ' + error.message, true);
            }
            throw error;
        }
    },

    async logout() {
        try {
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
                unsubscribeSnapshot = null;
            }
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
                await pullCloudToLocal(user, true);
                await pushLocalToCloud();
                if (!silent) {
                    showSyncNotice('Синхронизация завершена успешно!');
                }
            } catch (err) {
                console.error('[SyncManager] Force sync failed:', err);
                if (!silent) {
                    showSyncNotice('Ошибка при синхронизации: ' + err.message, true);
                }
            }
        } else {
            if (!silent) {
                showSyncNotice('Вы не вошли в аккаунт.', true);
            }
        }
    },

    // Mobile/Cross-browser Code Sync Links
    async linkWithCode(code) {
        if (!code || code.trim().length < 5) {
            showSyncNotice('Неверный код переноса!', true);
            return;
        }
        const cleanCode = code.trim();
        const currentOverride = localStorage.getItem('sync_manager_override_uid');
        if (currentOverride !== cleanCode) {
            // New linked account: clear previous timestamps so we cleanly adopt cloud data
            const projectName = getProjectName();
            originalRemoveItem.call(localStorage, 'last_sync_timestamp_' + projectName);
            originalRemoveItem.call(localStorage, 'last_sync_payload_' + projectName);
        }
        originalSetItem.call(localStorage, 'sync_manager_override_uid', cleanCode);
        const mockUser = getSyncUser();
        if (mockUser) {
            setupRealtimeListener(mockUser);
            await pullCloudToLocal(mockUser, true);
            showSyncNotice('Устройство успешно связано по коду!');
            window.location.reload();
        }
    },

    // Check remote updates on demand (e.g. when opening modals)
    async checkRemoteUpdates() {
        const user = getSyncUser();
        if (user) {
            await pullCloudToLocal(user);
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
        setupRealtimeListener(mockUser);
        await pullCloudToLocal(mockUser);
    }, 500);
}

// Mobile application lifecycle & visibility triggers
function forceSyncOnLifecycle() {
    if (syncTimeout) {
        console.log('[SyncManager] App lifecycle trigger: clearing debounce and forcing immediate cloud backup...');
        clearTimeout(syncTimeout);
        syncTimeout = null;
        pushLocalToCloud();
    }
}

// Foreground / Focus triggers: pull newest data from Cloud when user switches back to the app/tab
let lastForegroundPull = 0;
function pullOnForeground() {
    const user = getSyncUser();
    const now = Date.now();
    if (user && (now - lastForegroundPull > 5000)) {
        lastForegroundPull = now;
        console.log('[SyncManager] App foregrounded, checking cloud updates...');
        pullCloudToLocal(user);
    }
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        pullOnForeground();
    } else {
        forceSyncOnLifecycle();
    }
});

window.addEventListener('focus', pullOnForeground);

// Periodic polling fallback (every 45s while tab is visible)
setInterval(() => {
    if (document.visibilityState === 'visible') {
        const user = getSyncUser();
        if (user) {
            pullCloudToLocal(user);
        }
    }
}, 45000);

// Listen to pause (Capacitor/Cordova backgrounding) and beforeunload (tab closed) events
document.addEventListener('pause', forceSyncOnLifecycle);
window.addEventListener('beforeunload', forceSyncOnLifecycle);

console.log('[SyncManager] Real-time Transparent Sync active.');
