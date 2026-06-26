// Supabase Configuration - Web OS Community project
const SUPABASE_URL = 'https://lkwlvoivjintumgmqxdw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrd2x2b2l2amludHVtZ21xeGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDc0MzUsImV4cCI6MjA5Nzk4MzQzNX0.Gmy5KhG6XO8djN2HmTx-CpP1BPSk9i24pUZ9oyN3N8k';

// Initialize Supabase from global UMD build
function initSupabase() {
    if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
        window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase initialized');
        return true;
    }
    console.warn('⚠️ Supabase global not found');
    return false;
}

// Try init when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabase);
} else {
    initSupabase();
}
