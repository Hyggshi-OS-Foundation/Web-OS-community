// Supabase Configuration - Web OS Community project
const SUPABASE_URL = 'https://lkwlvoivjintumgmqxdw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrd2x2b2l2amludHVtZ21xeGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDc0MzUsImV4cCI6MjA5Nzk4MzQzNX0.Gmy5KhG6XO8djN2HmTx-CpP1BPSk9i24pUZ9oyN3N8k';

// Initialize Supabase from global UMD build
function initSupabase() {
    if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
        window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storage: localStorage
            }
        });
        console.log('✅ Supabase initialized');
        console.log('🔑 Checking existing session...');
        
        // Check if we have an existing session on load
        window.supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                console.log('👤 Existing user session found:', session.user.email);
            } else {
                console.log('👤 No existing session');
            }
        });
        
        return true;
    }
    console.warn('⚠️ Supabase global not found');
    return false;
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
