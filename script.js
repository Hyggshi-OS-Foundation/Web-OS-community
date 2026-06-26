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

    let projects = [...osList];

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
        card.setAttribute('data-license', os.license || 'MIT');
        card.setAttribute('data-platform', os.platform || 'Netlify');
        card.setAttribute('data-os-status', os.os_status || 'Stable');
        card.setAttribute('data-featured', os.featured ? 'true' : 'false');
        card.setAttribute('data-owner', os.owner || os.submitter_username || os.username || os.author || 'Unknown');
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
        license: p.license || 'MIT',
        platform: p.platform || 'Netlify',
        os_status: p.os_status || 'Stable',
        featured: p.featured || false,
        owner: p.submitter_username || p.owner || p.author || 'Unknown',
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
    
    const isFileProtocol = window.location.protocol === 'file:';
    
    if (isFileProtocol) {
        document.getElementById('previewLoading').style.display = 'none';
        document.getElementById('modalIframe').style.display = 'none';
        document.getElementById('previewUnavailable').style.display = 'block';
        document.getElementById('previewUnavailable').querySelector('p:last-child').textContent = 'Preview not available in local mode. Click "Launch" to open in browser.';
        document.querySelector('.preview-label').textContent = '⚠️ PREVIEW UNAVAILABLE (LOCAL MODE)';
        document.querySelector('.preview-label').style.color = '#f1c40f';
    } else {
        document.getElementById('previewLoading').style.display = 'block';
        document.getElementById('modalIframe').style.display = 'none';
        document.getElementById('previewUnavailable').style.display = 'none';
        
        const iframe = document.getElementById('modalIframe');
        iframe.src = url;
        
        setTimeout(() => {
            if (document.getElementById('previewLoading').style.display !== 'none') {
                document.getElementById('previewLoading').style.display = 'none';
                document.getElementById('previewUnavailable').style.display = 'block';
                iframe.src = '';
                iframe.style.display = 'none';
            }
        }, 3000);
    }
    
    document.getElementById('launchModal').classList.add('show');
}

function hideLaunchModal() {
    document.getElementById('launchModal').classList.remove('show');
    document.getElementById('modalIframe').src = '';
    document.getElementById('modalIframe').style.display = 'block';
    document.getElementById('previewLoading').style.display = 'none';
    document.getElementById('previewUnavailable').style.display = 'none';
    document.querySelector('.preview-label').textContent = '🔴 LIVE PREVIEW';
    document.querySelector('.preview-label').style.color = '';
    pendingUrl = '';
}

document.getElementById('modalIframe').addEventListener('load', function() {
    document.getElementById('previewLoading').style.display = 'none';
    this.style.display = 'block';
    document.getElementById('previewUnavailable').style.display = 'none';
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
    const owner = card.getAttribute('data-owner') || 'Unknown';
    const foundation = card.getAttribute('data-foundation') || 'N/A';
    const date = card.getAttribute('data-date') || '';

    pendingRepo = 'https://github.com/' + author + '/' + repo;

    const description = card.getAttribute('data-description') || '';
    const version = card.getAttribute('data-version') || '';
    const license = card.getAttribute('data-license') || 'MIT';
    const platform = card.getAttribute('data-platform') || 'Netlify';
    const osStatus = card.getAttribute('data-os-status') || 'Stable';

    document.getElementById('infoModalLogo').src = imgSrc;
    document.getElementById('infoModalTitle').textContent = name;
    document.getElementById('infoAuthor').textContent = author;
    document.getElementById('infoOwner').textContent = owner;
    document.getElementById('infoRepo').textContent = repo;
    document.getElementById('infoFoundation').textContent = foundation;
    document.getElementById('infoVersion').textContent = version;
    document.getElementById('infoDescription').textContent = description;
    document.getElementById('infoDescriptionRow').style.display = description ? 'flex' : 'none';
    document.getElementById('infoLicense').textContent = license;
    document.getElementById('infoPlatform').textContent = platform;
    document.getElementById('infoStatus').textContent = osStatus;

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

// === License Modal ===
async function showLicenseModal() {
    const modal = document.getElementById('licenseModal');
    const content = document.getElementById('licenseContent');
    
    if (!content.innerHTML.trim()) {
        try {
            const response = await fetch('license/hosl-1.3.html');
            if (response.ok) {
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const bodyContent = doc.body.innerHTML;
                content.innerHTML = bodyContent;
            } else {
                content.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">Failed to load license. <a href="license/hosl-1.3.html" target="_blank" style="color: var(--accent);">Open in new tab</a></p>';
            }
        } catch (err) {
            console.error('Failed to load license:', err);
            content.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">Failed to load license. <a href="license/hosl-1.3.html" target="_blank" style="color: var(--accent);">Open in new tab</a></p>';
        }
    }
    
    modal.classList.add('show');
}

function hideLicenseModal() {
    document.getElementById('licenseModal').classList.remove('show');
}

document.getElementById('licenseModal').addEventListener('click', function(e) {
    if (e.target === this) hideLicenseModal();
});

// Random math question state
let verifyAnswer = 0;

function generateVerifyQuestion() {
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, question;
    
    switch (op) {
        case '+':
            a = Math.floor(Math.random() * 50) + 5;
            b = Math.floor(Math.random() * 50) + 5;
            question = `What is ${a} + ${b}?`;
            verifyAnswer = a + b;
            break;
        case '-':
            a = Math.floor(Math.random() * 80) + 10;
            b = Math.floor(Math.random() * a) + 1;
            question = `What is ${a} - ${b}?`;
            verifyAnswer = a - b;
            break;
        case '*':
            a = Math.floor(Math.random() * 12) + 2;
            b = Math.floor(Math.random() * 10) + 2;
            question = `What is ${a} × ${b}?`;
            verifyAnswer = a * b;
            break;
    }
    
    document.getElementById('verifyQuestion').textContent = question;
}

// === Submit Modal ===
function showSubmitModal() {
    if (!getCurrentUser()) {
        showAccountModal();
        const status = document.getElementById('signInStatus');
        showStatus(status, 'error', '❌ Please create an account or sign in before submitting a project.');
        return;
    }

    generateVerifyQuestion();
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

    const user = getCurrentUser();
    if (!user) {
        showStatus(status, 'error', '❌ Please create an account or sign in before submitting a project.');
        setTimeout(() => {
            hideSubmitModal();
            showAccountModal();
        }, 900);
        return;
    }

    const website = document.getElementById('formWebsite').value.trim();
    if (website) {
        console.warn('Spam detected: honeypot field filled');
        showStatus(status, 'error', '❌ Spam detected. Please do not fill hidden fields.');
        return;
    }

    const verify = document.getElementById('formVerify').value.trim();
    if (parseInt(verify) !== verifyAnswer) {
        showStatus(status, 'error', '❌ Verification failed. Please answer the math question correctly.');
        return;
    }

    const name = document.getElementById('formName').value.trim();
    const url = document.getElementById('formUrl').value.trim();
    const icon = document.getElementById('formIcon').value.trim();
    const author = document.getElementById('formAuthor').value.trim();
    const repo = document.getElementById('formRepo').value.trim();
    
    const pathTraversalRegex = /(\.\.\/|\.\.\\)/i;
    if (pathTraversalRegex.test(author) || pathTraversalRegex.test(repo)) {
        showStatus(status, 'error', '❌ Invalid GitHub credentials detected.');
        return;
    }

    showStatus(status, 'processing', '⏳ Verifying GitHub repository...');
    
    try {
        const ghResponse = await fetch(`https://api.github.com/repos/${encodeURIComponent(author)}/${encodeURIComponent(repo)}`, {
            headers: { 'Accept': 'application/vnd.github.v3+json' }
        });
        
        if (!ghResponse.ok) {
            if (ghResponse.status === 404) {
                showStatus(status, 'error', '❌ GitHub repository not found. Please verify your GitHub username and repository name are correct and public.');
                return;
            } else if (ghResponse.status === 403) {
                console.warn('GitHub API rate limited, skipping verification');
            } else {
                showStatus(status, 'error', '❌ GitHub verification failed (HTTP ' + ghResponse.status + '). Please try again.');
                return;
            }
        }
    } catch (err) {
        console.warn('GitHub API error (network issue), skipping verification:', err);
    }

    const foundation = document.getElementById('formFoundation').value.trim();
    const description = document.getElementById('formDescription').value.trim();
    const version = document.getElementById('formVersion').value.trim();
    const license = document.getElementById('formLicense').value;
    const platform = document.getElementById('formPlatform').value;
    const osStatus = document.getElementById('formStatusSelect').value;
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
        license,
        platform,
        os_status: osStatus,
        featured: false,
        tags,
        links: links.length ? links : [{ label: 'Main', url }]
    };

    try {
        if (!window.supabase) {
            throw new Error('Supabase chưa được cấu hình. Vui lòng liên hệ admin.');
        }

        payload.submitter_id = user.id;
        payload.submitter_username = user.username;

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

// === Account Modal (Custom Auth via RPC) ===
function showAccountModal() {
    updateAuthUI();
    document.getElementById('accountModal').classList.add('show');
}

function hideAccountModal() {
    document.getElementById('accountModal').classList.remove('show');
    document.getElementById('signInStatus').style.display = 'none';
    document.getElementById('signUpStatus').style.display = 'none';
}

document.getElementById('accountModal').addEventListener('click', function(e) {
    if (e.target === this) hideAccountModal();
});

function getInitials(username) {
    if (!username) return '?';
    const parts = username.split(/[._-]/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
}

async function updateAuthUI() {
    if (!window.supabase) {
        document.getElementById('accountStatusText').textContent = '⚠️ Supabase not configured';
        document.getElementById('authForms').style.display = 'none';
        document.getElementById('loggedInView').style.display = 'none';
        return;
    }

    const user = getCurrentUser();
    
    if (user) {
        document.getElementById('authForms').style.display = 'none';
        document.getElementById('loggedInView').style.display = 'block';
        
        const banner = document.getElementById('profileBanner');
        banner.style.background = `linear-gradient(135deg, ${user.color} 0%, #333 100%)`;
        
        const avatar = document.getElementById('profileAvatar');
        avatar.textContent = getInitials(user.username);
        
        document.getElementById('userName').textContent = user.username;
        document.getElementById('userBio').textContent = user.bio || 'No bio yet';
        document.getElementById('userColor').textContent = '🎨 Color: ' + user.color;
        document.getElementById('accountStatusText').textContent = 'Signed in as ' + user.username;
    } else {
        document.getElementById('authForms').style.display = 'block';
        document.getElementById('loggedInView').style.display = 'none';
        document.getElementById('accountStatusText').textContent = 'Sign in or create an account';
    }
}

async function signIn(e) {
    e.preventDefault();
    const status = document.getElementById('signInStatus');
    status.style.display = 'none';

    const username = document.getElementById('signInUsername').value.trim();
    const password = document.getElementById('signInPassword').value;

    if (!window.supabase) {
        showStatus(status, 'error', '❌ Supabase not configured.');
        return;
    }

    try {
        const result = await callRPC('signin', {
            p_username: username,
            p_password: password
        });

        if (!result.success) {
            showStatus(status, 'error', '❌ ' + result.error);
            return;
        }

        console.log('Sign in success:', result.user);
        saveUserSession(result.user);
        
        showStatus(status, 'success', '✅ Welcome back, ' + result.user.username + '!');
        setTimeout(() => {
            hideAccountModal();
            updateAccountIcon(true);
            window.location.reload();
        }, 800);
    } catch (err) {
        console.error('Sign in error:', err);
        showStatus(status, 'error', '❌ ' + formatSupabaseError(err, 'Sign in failed.'));
    }
}

function formatSupabaseError(err, fallback) {
    if (!err) return fallback;
    const parts = [err.message, err.details, err.hint, err.code].filter(Boolean);
    return parts.length ? parts.join(' ') : fallback;
}

async function signUp(e) {
    e.preventDefault();
    const status = document.getElementById('signUpStatus');
    status.style.display = 'none';

    const username = document.getElementById('signUpUsername').value.trim();
    const password = document.getElementById('signUpPassword').value;

    if (!window.supabase) {
        showStatus(status, 'error', '❌ Supabase not configured.');
        return;
    }

    if (password.length < 6) {
        showStatus(status, 'error', '❌ Password must be at least 6 characters.');
        return;
    }

    if (username.length < 3) {
        showStatus(status, 'error', '❌ Username must be at least 3 characters.');
        return;
    }

    try {
        const result = await callRPC('signup', {
            p_username: username,
            p_password: password
        });

        if (!result.success) {
            showStatus(status, 'error', '❌ ' + result.error);
            return;
        }

        console.log('Sign up success:', result.user);
        saveUserSession(result.user);
        
        showStatus(status, 'success', '✅ Welcome, ' + result.user.username + '!');
        setTimeout(() => {
            hideAccountModal();
            updateAccountIcon(true);
            window.location.reload();
        }, 800);
    } catch (err) {
        console.error('Sign up error:', err);
        showStatus(status, 'error', '❌ ' + formatSupabaseError(err, 'Account creation failed.'));
    }
}

async function signOut() {
    console.log('Signing out user:', getCurrentUser()?.username);
    clearUserSession();
    hideAccountModal();
    updateAccountIcon(false);
    window.location.reload();
}

function togglePassword(inputId, toggleEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        toggleEl.textContent = '👁️‍🗨️';
    } else {
        input.type = 'password';
        toggleEl.textContent = '👁️';
    }
}

function updateAccountIcon(isLoggedIn) {
    const icon = document.getElementById('accountIcon');
    icon.textContent = isLoggedIn ? '✅' : '👤';
}

// === Init ===
document.addEventListener('DOMContentLoaded', function() {
    buildCards();
    
    const submitBtn = document.querySelector('.footer-submit-btn');
    const licenseBtn = document.querySelector('.footer-license-btn');
    
    if (submitBtn) {
        submitBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showSubmitModal();
        });
    }
    
    if (licenseBtn) {
        licenseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showLicenseModal();
        });
    }

    // Initialize account icon based on saved session
    const user = getCurrentUser();
    updateAccountIcon(!!user);
    if (user) {
        console.log('👤 User session restored:', user.username);
    }
});
