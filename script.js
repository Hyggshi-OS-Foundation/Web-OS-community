let pendingUrl = '';
let pendingRepo = '';
let activeTag = 'all';
const ratings = JSON.parse(localStorage.getItem('osRatings') || '{}');

function goto(url) {
    window.open(url, '_blank');
}

// === Theme Toggle ===
function toggleTheme() {
    document.body.classList.toggle('light');
    const icon = document.getElementById('themeIcon');
    icon.textContent = document.body.classList.contains('light') ? '🌙' : '☀️';
    localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
}

if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light');
    document.getElementById('themeIcon').textContent = '🌙';
}

// === Build Cards from osList ===
async function buildCards() {
    const grid = document.getElementById('cardsGrid');
    grid.innerHTML = '';

    let projects = [...osList]; // fallback to static list

    // Try fetch from Supabase if configured
    if (window.supabase) {
        try {
            const { data, error } = await window.supabase
                .from('projects')
                .select('*')
                .eq('status', 'approved')
                .order('featured', { ascending: false })
                .order('created_at', { ascending: false });

            if (!error && data && data.length > 0) {
                projects = data.map(mapProjectToCard);
            }
        } catch (e) {
            console.warn('Failed to fetch from Supabase, using static list:', e);
        }
    }

    projects.forEach(os => {
        const tagsStr = (os.tags || []).join(',');
        const linksHtml = (os.links || []).map(l =>
            `<a href="#" onclick="event.preventDefault(); goto(\`${l.url}\`)">${l.label}</a>`
        ).join('');

        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('data-name', os.name);
        card.setAttribute('data-img', os.icon);
        card.setAttribute('data-url', os.url);
        card.setAttribute('data-author', os.author || 'Unknown');
        card.setAttribute('data-repo', os.repo || 'N/A');
        card.setAttribute('data-foundation', os.foundation || 'N/A');
        card.setAttribute('data-description', os.description || '');
        card.setAttribute('data-version', os.version || '');
        card.setAttribute('data-featured', os.featured ? 'true' : 'false');
        card.setAttribute('data-tags', tagsStr);

        const featuredBadge = os.featured ? '<div class="featured-badge">⭐ Featured</div>' : '';

        card.innerHTML = `
            ${featuredBadge}
            <div class="card-border-top"></div>
            <div class="img">
                <img src="${os.icon}" alt="${os.name}" onerror="this.src='images/placeholder.png'">
            </div>
            <span>${os.name}</span>
            <div class="card-tags"></div>
            <div class="card-rating">
                <span class="stars" data-rating="0"></span>
                <span class="rating-count" data-name="${os.name}"></span>
            </div>
            <div class="card-buttons">
                <div class="btn-group">
                    <button class="run-btn" onclick="showLaunchModal(this)">Run</button>
                    <button class="dropdown-toggle" onclick="toggleDropdown(this)">▾</button>
                    <div class="dropdown-menu">${linksHtml}</div>
                </div>
                <button class="info-btn" onclick="showInfoModal(this)" title="Info">i</button>
            </div>
        `;

        grid.appendChild(card);
    });

    initTags();
    initRatings();
    initDropdowns();
}

function mapProjectToCard(p) {
    const links = (p.links || []).map(l =>
        typeof l === 'string' ? { label: 'Main', url: l } : l
    );

    return {
        name: p.name,
        url: p.url,
        icon: p.icon,
        author: p.author,
        repo: p.repo,
        foundation: p.foundation || 'N/A',
        description: p.description || '',
        version: p.version || '1.0',
        featured: p.featured || false,
        tags: p.tags || [],
        links: links.length ? links : [{ label: 'Main', url: p.url }]
    };
}

// === Tags ===
function initTags() {
    const allTags = new Set();
    document.querySelectorAll('.card').forEach(card => {
        const tags = (card.getAttribute('data-tags') || '').split(',').map(t => t.trim()).filter(Boolean);
        tags.forEach(t => allTags.add(t));
    });

    const container = document.getElementById('tagFilters');
    container.innerHTML = '<button class="tag-filter active" data-tag="all" onclick="filterByTag(\'all\')">All</button>';

    [...allTags].sort().forEach(tag => {
        container.innerHTML += `<button class="tag-filter" data-tag="${tag}" onclick="filterByTag('${tag}')">${tag}</button>`;
    });

    document.querySelectorAll('.card').forEach(card => {
        const tags = (card.getAttribute('data-tags') || '').split(',').map(t => t.trim()).filter(Boolean);
        const tagContainer = card.querySelector('.card-tags');
        tagContainer.innerHTML = tags.map(t => `<span class="card-tag">${t}</span>`).join('');
    });
}

function filterByTag(tag) {
    activeTag = tag;
    document.querySelectorAll('.tag-filter').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tag') === tag);
    });
    filterCards();
}

function filterCards() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        const name = card.getAttribute('data-name').toLowerCase();
        const tags = (card.getAttribute('data-tags') || '').toLowerCase();
        let visible = true;

        if (filter && !name.includes(filter)) {
            visible = false;
        }

        if (activeTag !== 'all' && !tags.includes(activeTag)) {
            visible = false;
        }

        card.classList.toggle('hidden', !visible);
    });
}

// === Rating System ===
function renderStars(container, rating, cardName) {
    container.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = 'star' + (i <= rating ? ' active' : '');
        star.textContent = '★';
        star.dataset.value = i;

        star.addEventListener('mouseenter', function() {
            const siblings = this.parentElement.querySelectorAll('.star');
            siblings.forEach((s, idx) => s.classList.toggle('hover', idx < i));
        });

        star.addEventListener('mouseleave', function() {
            this.parentElement.querySelectorAll('.star').forEach(s => s.classList.remove('hover'));
        });

        star.addEventListener('click', function() {
            setRating(cardName, parseInt(this.dataset.value));
        });

        container.appendChild(star);
    }
}

function setRating(cardName, value) {
    ratings[cardName] = value;
    localStorage.setItem('osRatings', JSON.stringify(ratings));
    updateAllRatings();
    updateRatingCounts();
}

function updateAllRatings() {
    document.querySelectorAll('.card').forEach(card => {
        const name = card.getAttribute('data-name');
        const rating = ratings[name] || 0;
        const starContainer = card.querySelector('.stars');
        if (starContainer) {
            starContainer.querySelectorAll('.star').forEach((s, idx) => s.classList.toggle('active', idx < rating));
        }
    });
}

function updateRatingCounts() {
    document.querySelectorAll('.rating-count').forEach(el => {
        const name = el.getAttribute('data-name');
        const r = ratings[name] || 0;
        el.textContent = r > 0 ? r + '/5' : '';
    });
}

function initRatings() {
    document.querySelectorAll('.stars').forEach(container => {
        const card = container.closest('.card');
        const name = card.getAttribute('data-name');
        const rating = ratings[name] || 0;
        renderStars(container, rating, name);
    });
    updateRatingCounts();
}

// === Dropdown ===
function initDropdowns() {
    document.querySelectorAll('.btn-group').forEach(group => {
        let hoverTimer;
        group.addEventListener('mouseenter', function() {
            clearTimeout(hoverTimer);
            const menu = this.querySelector('.dropdown-menu');
            document.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));
            if (menu) menu.classList.add('show');
        });
        group.addEventListener('mouseleave', function() {
            hoverTimer = setTimeout(() => {
                const menu = this.querySelector('.dropdown-menu.show');
                if (menu) menu.classList.remove('show');
            }, 200);
        });
    });
}

function toggleDropdown(btn) {
    const menu = btn.nextElementSibling;
    const isOpen = menu.classList.contains('show');
    document.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));
    if (!isOpen) menu.classList.add('show');
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.btn-group')) {
        document.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));
    }
});

// === Launch Modal ===
function showLaunchModal(btn) {
    const card = btn.closest('.card');
    const name = card.getAttribute('data-name');
    const imgSrc = card.getAttribute('data-img');
    const url = card.getAttribute('data-url');

    pendingUrl = url;
    document.getElementById('modalLogo').src = imgSrc;
    document.getElementById('modalTitle').textContent = 'Launching ' + name;
    document.getElementById('modalIframe').src = url;
    document.getElementById('previewLoading').style.display = 'block';
    document.getElementById('launchModal').classList.add('show');
}

function hideLaunchModal() {
    document.getElementById('launchModal').classList.remove('show');
    document.getElementById('modalIframe').src = '';
    pendingUrl = '';
}

document.getElementById('modalIframe').addEventListener('load', function() {
    document.getElementById('previewLoading').style.display = 'none';
});

document.getElementById('modalLaunchBtn').addEventListener('click', function() {
    if (pendingUrl) { goto(pendingUrl); hideLaunchModal(); }
});

document.getElementById('launchModal').addEventListener('click', function(e) {
    if (e.target === this) hideLaunchModal();
});

// === Info Modal ===
function showInfoModal(btn) {
    const card = btn.closest('.card');
    const name = card.getAttribute('data-name');
    const imgSrc = card.getAttribute('data-img');
    const author = card.getAttribute('data-author') || 'Unknown';
    const repo = card.getAttribute('data-repo') || 'N/A';
    const foundation = card.getAttribute('data-foundation') || 'N/A';
    const date = card.getAttribute('data-date') || '';

    pendingRepo = 'https://github.com/' + author + '/' + repo;

    const description = card.getAttribute('data-description') || '';
    const version = card.getAttribute('data-version') || '';

    document.getElementById('infoModalLogo').src = imgSrc;
    document.getElementById('infoModalTitle').textContent = name;
    document.getElementById('infoAuthor').textContent = author;
    document.getElementById('infoRepo').textContent = repo;
    document.getElementById('infoFoundation').textContent = foundation;
    document.getElementById('infoVersion').textContent = version;
    document.getElementById('infoDescription').textContent = description;
    document.getElementById('infoDescriptionRow').style.display = description ? 'flex' : 'none';

    if (date) {
        document.getElementById('infoDate').textContent = date;
    } else {
        document.getElementById('infoDate').textContent = 'Fetching...';
        fetchRepoDate(author, repo);
    }

    document.getElementById('infoModal').classList.add('show');
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
}

function fetchRepoDate(author, repo) {
    if (!author || author === 'Unknown' || !repo || repo === 'N/A') {
        document.getElementById('infoDate').textContent = 'N/A';
        return;
    }
    fetch('https://api.github.com/repos/' + author + '/' + repo)
        .then(r => { if (!r.ok) throw Error(); return r.json(); })
        .then(d => { if (d.created_at) document.getElementById('infoDate').textContent = formatDate(d.created_at); })
        .catch(() => { document.getElementById('infoDate').textContent = 'N/A'; });
}

function hideInfoModal() {
    document.getElementById('infoModal').classList.remove('show');
    pendingRepo = '';
}

function openInfoRepo() {
    if (pendingRepo) { goto(pendingRepo); hideInfoModal(); }
}

document.getElementById('infoModal').addEventListener('click', function(e) {
    if (e.target === this) hideInfoModal();
});

// === Auth Modal ===
function switchAuthTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const tabs = document.querySelectorAll('.auth-tab');
    
    tabs.forEach(t => t.classList.remove('active'));
    
    if (tab === 'login') {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        tabs[0].classList.add('active');
    } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        tabs[1].classList.add('active');
    }
}

function showAuthModal() {
    document.getElementById('authModal').classList.add('show');
    updateAuthUI();
}

function hideAuthModal() {
    document.getElementById('authModal').classList.remove('show');
}

document.getElementById('authModal').addEventListener('click', function(e) {
    if (e.target === this) hideAuthModal();
});

async function handleLogin(e) {
    e.preventDefault();
    const status = document.getElementById('loginStatus');
    status.style.display = 'none';
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showAuthStatus(status, 'error', 'Please fill in all fields.');
        return;
    }
    
    try {
        if (!window.supabase) {
            throw new Error('Supabase chưa được cấu hình.');
        }
        
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        showAuthStatus(status, 'success', '✅ Login successful!');
        setTimeout(() => {
            hideAuthModal();
            updateAuthUI();
        }, 1000);
    } catch (err) {
        console.error('Login error:', err);
        showAuthStatus(status, 'error', '❌ ' + (err.message || 'Login failed. Please try again.'));
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const status = document.getElementById('signupStatus');
    status.style.display = 'none';
    
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const username = document.getElementById('signupUsername').value.trim();
    
    if (!email || !password || !username) {
        showAuthStatus(status, 'error', 'Please fill in all fields.');
        return;
    }
    
    if (password.length < 6) {
        showAuthStatus(status, 'error', 'Password must be at least 6 characters.');
        return;
    }
    
    try {
        if (!window.supabase) {
            throw new Error('Supabase chưa được cấu hình.');
        }
        
        const { data, error } = await window.supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    display_name: username
                }
            }
        });
        
        if (error) throw error;
        
        showAuthStatus(status, 'success', '✅ Account created! Please check your email to verify.');
        setTimeout(() => {
            hideAuthModal();
            updateAuthUI();
        }, 2000);
    } catch (err) {
        console.error('Signup error:', err);
        showAuthStatus(status, 'error', '❌ ' + (err.message || 'Signup failed. Please try again.'));
    }
}

async function handleLogout() {
    try {
        if (!window.supabase) {
            console.warn('Supabase not configured');
            return;
        }
        
        await window.supabase.auth.signOut();
        updateAuthUI();
        console.log('Logged out successfully');
    } catch (err) {
        console.error('Logout error:', err);
    }
}

function showAuthStatus(el, type, msg) {
    el.className = 'form-status ' + type;
    el.textContent = msg;
    el.style.display = 'block';
}

async function updateAuthUI() {
    const authLink = document.getElementById('authLink');
    const logoutBtn = document.getElementById('logoutBtn');
    const zashiSection = document.getElementById('zashiSection');
    
    if (!window.supabase) {
        authLink.style.display = 'inline';
        logoutBtn.style.display = 'none';
        if (zashiSection) zashiSection.style.display = 'none';
        return;
    }
    
    try {
        const { data: { session } } = await window.supabase.auth.getSession();
        
        if (session) {
            authLink.style.display = 'none';
            logoutBtn.style.display = 'block';
            if (zashiSection) zashiSection.style.display = 'block';
        } else {
            authLink.style.display = 'inline';
            logoutBtn.style.display = 'none';
            if (zashiSection) zashiSection.style.display = 'none';
        }
    } catch (err) {
        console.error('Auth check error:', err);
        authLink.style.display = 'inline';
        logoutBtn.style.display = 'none';
        if (zashiSection) zashiSection.style.display = 'none';
    }
}

async function linkZashiAccount() {
    const username = document.getElementById('zashiUsername').value.trim();
    const status = document.getElementById('zashiStatus');
    
    if (!username) {
        status.textContent = '❌ Please enter Zashi username';
        status.style.color = '#e74c3c';
        return;
    }
    
    // Remove @ if user included it
    const cleanUsername = username.replace('@', '');
    
    try {
        if (!window.supabase) {
            throw new Error('Supabase not configured');
        }
        
        // Get current user
        const { data: { session } } = await window.supabase.auth.getSession();
        if (!session) {
            throw new Error('You must be logged in to link Zashi account');
        }
        
        // Check if Zashi account exists by querying Zashi's Supabase
        // Using the provided Zashi credentials
        const ZASHI_URL = 'https://kwgxqxffjruykjzjhlkq.supabase.co';
        const ZASHI_KEY = 'sb_publishable_cj9pOUvJFPdOEtZCziWULQ_c-Ch1xPb';
        
        // Query Zashi database to check if user exists
        const response = await fetch(`${ZASHI_URL}/rest/v1/profiles?username=eq.${cleanUsername}`, {
            headers: {
                'apikey': ZASHI_KEY,
                'Authorization': `Bearer ${ZASHI_KEY}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to verify Zashi account');
        }
        
        const zashiData = await response.json();
        
        if (!zashiData || zashiData.length === 0) {
            status.textContent = '❌ Zashi account not found. Please check the username.';
            status.style.color = '#e74c3c';
            return;
        }
        
        // Update current user's profile with Zashi info
        const { error: updateError } = await window.supabase
            .from('profiles')
            .update({
                zashi_linked: true,
                zashi_username: cleanUsername
            })
            .eq('id', session.user.id);
        
        if (updateError) throw updateError;
        
        status.textContent = '✅ Zashi account linked successfully!';
        status.style.color = '#27ae60';
        console.log('Zashi account linked:', cleanUsername);
        
    } catch (err) {
        console.error('Zashi link error:', err);
        status.textContent = '❌ ' + (err.message || 'Failed to link Zashi account');
        status.style.color = '#e74c3c';
    }
}

// === Submit Modal ===
function showSubmitModal() {
    document.getElementById('submitModal').classList.add('show');
    document.getElementById('formStatus').style.display = 'none';
}

function hideSubmitModal() {
    document.getElementById('submitModal').classList.remove('show');
    document.getElementById('submitForm').reset();
}

document.getElementById('submitModal').addEventListener('click', function(e) {
    if (e.target === this) hideSubmitModal();
});

async function submitProject(e) {
    e.preventDefault();
    const status = document.getElementById('formStatus');
    status.style.display = 'none';

    const name = document.getElementById('formName').value.trim();
    const url = document.getElementById('formUrl').value.trim();
    const icon = document.getElementById('formIcon').value.trim();
    const author = document.getElementById('formAuthor').value.trim();
    const repo = document.getElementById('formRepo').value.trim();
    const foundation = document.getElementById('formFoundation').value.trim();
    const description = document.getElementById('formDescription').value.trim();
    const version = document.getElementById('formVersion').value.trim();
    const tagsRaw = document.getElementById('formTags').value.trim();
    const linksRaw = document.getElementById('formLinks').value.trim();

    if (!name || !url || !icon || !author || !repo) {
        showStatus(status, 'error', 'Please fill in all required fields.');
        return;
    }

    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
    const links = [];
    if (linksRaw) {
        linksRaw.split('\n').forEach(line => {
            const parts = line.split('|').map(s => s.trim());
            if (parts.length >= 2 && parts[0] && parts[1]) {
                links.push({ label: parts[0], url: parts[1] });
            }
        });
    }

    const payload = {
        name,
        url,
        icon,
        author,
        repo,
        foundation: foundation || 'N/A',
        description: description || '',
        version: version || '1.0',
        featured: false,
        tags,
        links: links.length ? links : [{ label: 'Main', url }]
    };

    try {
        if (!window.supabase) {
            throw new Error('Supabase chưa được cấu hình. Vui lòng liên hệ admin.');
        }

        // Get current user if logged in
        const { data: { session } } = await window.supabase.auth.getSession();
        if (session) {
            payload.user_id = session.user.id;
        }

        console.log('Submitting payload:', payload);

        const { data, error } = await window.supabase
            .from('projects')
            .insert([payload]);

        if (error) {
            console.error('Supabase insert error:', error);
            throw error;
        }
        
        console.log('Insert success:', data);

        showStatus(status, 'success', '✅ Project submitted successfully! It will appear after review.');
        document.getElementById('submitForm').reset();
        setTimeout(() => hideSubmitModal(), 2000);
    } catch (err) {
        console.error('Submit error:', err);
        showStatus(status, 'error', '❌ ' + (err.message || 'Submission failed. Please try again later.'));
    }
}

function showStatus(el, type, msg) {
    el.className = 'form-status ' + type;
    el.textContent = msg;
    el.style.display = 'block';
}

// === Init ===
document.addEventListener('DOMContentLoaded', function() {
    buildCards();
});