// ============================================================
// WebCoin System — Virtual Currency for Web-OS-Community
// Requires: supabase.js (callRPC, getCurrentUser, window.supabase)
// ============================================================

const COIN = {
    RATE_PROJECT:    5,
    SUBMIT_APPROVED: 50,
    RATED_PER_STAR:  10,
    DAILY_LOGIN:     2,
    BOOST_COST:      100,
    BADGE_COST:      200,
    FEATURED_COST:   500
};

let cachedCoins = null;

// ============================================================
// CORE: LOAD / EARN / SPEND
// ============================================================

async function loadUserCoins() {
    const user = getCurrentUser();
    if (!user || !window.supabase) return null;
    try {
        const result = await callRPC('get_user_coins', { p_user_id: user.id });
        cachedCoins = result;
        updateCoinUI();
        return result;
    } catch (err) {
        console.warn('loadUserCoins failed:', err);
        return null;
    }
}

async function earnCoins(amount, reason, metadata) {
    const user = getCurrentUser();
    if (!user || !window.supabase) return null;
    try {
        const result = await callRPC('earn_coins', {
            p_user_id:  user.id,
            p_amount:   amount,
            p_reason:   reason,
            p_metadata: metadata || {}
        });
        if (result && result.success) {
            cachedCoins = result;
            updateCoinUI();
            showCoinToast(`+${amount} 🪙`);
        }
        return result;
    } catch (err) {
        console.warn('earnCoins failed:', err);
        return null;
    }
}

async function spendCoins(amount, reason, metadata) {
    const user = getCurrentUser();
    if (!user || !window.supabase) return null;
    try {
        const result = await callRPC('spend_coins', {
            p_user_id:  user.id,
            p_amount:   amount,
            p_reason:   reason,
            p_metadata: metadata || {}
        });
        if (result && result.success) {
            cachedCoins = result;
            updateCoinUI();
            showCoinToast(`-${amount} 🪙`);
        } else if (result) {
            alert(`❌ Not enough coins! You need ${amount} but have ${result.balance || 0}.`);
        }
        return result;
    } catch (err) {
        console.warn('spendCoins failed:', err);
        return null;
    }
}

// ============================================================
// DAILY LOGIN
// ============================================================

async function claimDailyLogin() {
    const user = getCurrentUser();
    if (!user || !window.supabase) return;
    try {
        const result = await callRPC('claim_daily_login', { p_user_id: user.id });
        if (result && result.success) {
            cachedCoins = result;
            updateCoinUI();
            localStorage.setItem('webcoin_daily', new Date().toDateString());
            updateDailyLoginBtns(true);
            showCoinToast('+2 🪙 Daily login bonus!');
        } else if (result) {
            showCoinToast('📅 Already claimed today');
            updateDailyLoginBtns(true);
        }
    } catch (err) {
        console.warn('claimDailyLogin failed:', err);
    }
}

function updateDailyLoginBtns(claimed) {
    ['dailyLoginBtn', 'dailyLoginBtn2'].forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        if (claimed) {
            btn.textContent = '✅ Daily Login Claimed';
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        } else {
            btn.textContent = '📅 Daily Login (+2 🪙)';
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        }
    });
}

// ============================================================
// SPENDING FEATURES
// ============================================================

async function boostProject(projectId) {
    const user = getCurrentUser();
    if (!user) { alert('Please sign in first.'); return; }
    if (!confirm(`🚀 Boost this project for ${COIN.BOOST_COST} coins? It will be featured on top for 24h.`)) return;

    const result = await spendCoins(COIN.BOOST_COST, 'boost_project', { project_id: projectId });
    if (result && result.success && window.supabase) {
        try {
            await window.supabase.from('projects').update({ featured: true }).eq('id', projectId);
            alert('🚀 Project boosted to the top!');
            buildCards();
        } catch (err) {
            console.error('Boost update failed:', err);
            alert('⚠️ Coins spent but boost failed. Try again.');
        }
    }
}

async function unlockBadge(badgeName) {
    const user = getCurrentUser();
    if (!user) { alert('Please sign in first.'); return; }
    if (!confirm(`🎨 Unlock "${badgeName}" badge for ${COIN.BADGE_COST} coins?`)) return;

    const spend = await spendCoins(COIN.BADGE_COST, 'unlock_badge', { badge: badgeName });
    if (!spend || !spend.success) return;

    if (window.supabase) {
        try {
            await callRPC('unlock_badge', { p_user_id: user.id, p_badge: badgeName });
            alert(`🎨 Badge "${badgeName}" unlocked! It will show on your profile soon.`);
        } catch (err) {
            console.warn('Badge save failed:', err);
            alert('🎨 Badge unlocked (server save pending).');
        }
    }
}

async function buyFeaturedSlot(projectId, projectName) {
    const user = getCurrentUser();
    if (!user) { alert('Please sign in first.'); return; }
    if (!confirm(`⭐ Purchase featured slot for "${projectName || projectId}"? Cost: ${COIN.FEATURED_COST} coins (7 days).`)) return;

    const result = await spendCoins(COIN.FEATURED_COST, 'featured_slot', { project_id: projectId });
    if (result && result.success && window.supabase) {
        try {
            await window.supabase.from('projects').update({ featured: true }).eq('id', projectId);
            alert('⭐ Project is now featured!');
            buildCards();
        } catch (err) {
            console.error('Featured slot update failed:', err);
            alert('⚠️ Coins spent but featured slot setup failed. Try again.');
        }
    }
}

// ============================================================
// UI HELPERS
// ============================================================

function updateCoinUI() {
    const selectors = {
        coinBalance:       el => { el.textContent = (cachedCoins?.balance ?? 0) + ' 🪙'; },
        coinBalanceInline: el => { el.textContent = '🪙 ' + (cachedCoins?.balance ?? 0) + ' coins'; },
        webCoinBalance:    el => { el.textContent = (cachedCoins?.balance ?? 0) + ' 🪙'; }
    };
    for (const [id, fn] of Object.entries(selectors)) {
        const el = document.getElementById(id);
        if (el && cachedCoins) fn(el);
    }
}

function showCoinToast(message) {
    const el = document.getElementById('coinToast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    el.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => {
        el.style.transform = 'translateX(-50%) translateY(-80px)';
        setTimeout(() => el.classList.remove('show'), 300);
    }, 2200);
}

// ============================================================
// MODAL
// ============================================================

function showWebCoinModal() {
    document.getElementById('webCoinModal').classList.add('show');
    loadUserCoins().then(() => {
        renderLeaderboard();
        const last = localStorage.getItem('webcoin_daily');
        updateDailyLoginBtns(last === new Date().toDateString());
    });
}

function hideWebCoinModal() {
    document.getElementById('webCoinModal').classList.remove('show');
}

document.addEventListener('click', function (e) {
    const modal = document.getElementById('webCoinModal');
    if (e.target === modal) hideWebCoinModal();
});

// ============================================================
// INIT
// ============================================================

function initWebCoin() {
    const user = getCurrentUser();
    if (!user) return;

    loadUserCoins();

    // Sync daily-login button state with server truth on init
    // Local cache is a UX hint only; server is authoritative
    const last = localStorage.getItem('webcoin_daily');
    updateDailyLoginBtns(last === new Date().toDateString());
}

// ============================================================
// LEADERBOARD
// ============================================================

async function loadLeaderboard(limit) {
    if (!window.supabase) return [];
    try {
        const result = await callRPC('get_leaderboard', { p_limit: limit || 10 });
        return Array.isArray(result) ? result : [];
    } catch (err) {
        console.warn('loadLeaderboard failed:', err);
        return [];
    }
}

async function renderLeaderboard() {
    const list = document.getElementById('leaderboardList');
    if (!list) return;
    list.innerHTML = '<div style="color:var(--text-muted);padding:12px;">Loading...</div>';

    const data = await loadLeaderboard(10);
    if (!data || !data.length) {
        list.innerHTML = '<div style="color:var(--text-muted);padding:12px;">No data yet. Be the first to earn coins!</div>';
        return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    list.innerHTML = data.map(entry => {
        const icon = entry.rank <= 3 ? medals[entry.rank - 1] : '#' + entry.rank;
        return `<div class="lb-row">
            <span class="lb-rank">${icon}</span>
            <span class="lb-name">${entry.username}</span>
            <span class="lb-coins">${entry.balance} 🪙</span>
        </div>`;
    }).join('');
}

// ============================================================
// GLOBAL EXPORTS
// ============================================================
window.showWebCoinModal  = showWebCoinModal;
window.hideWebCoinModal  = hideWebCoinModal;
window.claimDailyLogin   = claimDailyLogin;
window.boostProject      = boostProject;
window.unlockBadge       = unlockBadge;
window.buyFeaturedSlot   = buyFeaturedSlot;
window.earnCoins         = earnCoins;
window.spendCoins        = spendCoins;
window.loadUserCoins     = loadUserCoins;
window.initWebCoin       = initWebCoin;