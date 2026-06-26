// Supabase Configuration - Web OS Community project (Custom Auth)
const SUPABASE_URL = 'https://lkwlvoivjintumgmqxdw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ne6NfWe5qXIHBmotY7MZ1w_axdrUdwJ';

// Initialize Supabase from global UMD build (for RPC calls only - no Supabase Auth)
function initSupabase() {
    if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
        window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase initialized (custom auth mode)');
        
        // Check if user is already logged in from localStorage
        const savedUser = localStorage.getItem('webos_user');
        if (savedUser) {
            try {
                window.currentUser = JSON.parse(savedUser);
                console.log('👤 Restored user session:', window.currentUser.username);
            } catch (e) {
                localStorage.removeItem('webos_user');
                window.currentUser = null;
            }
        } else {
            window.currentUser = null;
            console.log('👤 No saved session');
        }
        
        return true;
    }
    console.warn('⚠️ Supabase global not found');
    return false;
}

// Call RPC function
async function callRPC(functionName, params = {}) {
    if (!window.supabase) {
        throw new Error('Supabase not initialized');
    }
    const { data, error } = await window.supabase.rpc(functionName, params);
    if (error) throw error;
    return data;
}

// Save user session to localStorage
function saveUserSession(user) {
    window.currentUser = user;
    localStorage.setItem('webos_user', JSON.stringify(user));
}

// Clear user session
function clearUserSession() {
    window.currentUser = null;
    localStorage.removeItem('webos_user');
}

// Get current user
function getCurrentUser() {
    return window.currentUser;
}

// Initialize when DOM is ready and supabase library is loaded
function waitAndInit() {
    if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
        initSupabase();
    } else {
        console.log('⏳ Waiting for Supabase library to load...');
        setTimeout(waitAndInit, 100);
    }
}

// Try to init immediately, or wait for library to load
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    waitAndInit();
} else {
    document.addEventListener('DOMContentLoaded', waitAndInit);
}