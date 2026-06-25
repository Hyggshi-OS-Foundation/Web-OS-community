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
function buildCards() {
    const grid = document.getElementById('cardsGrid');
    grid.innerHTML = '';

    osList.forEach(os => {
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
        card.setAttribute('data-tags', tagsStr);

        card.innerHTML = `
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

    document.getElementById('infoModalLogo').src = imgSrc;
    document.getElementById('infoModalTitle').textContent = name;
    document.getElementById('infoAuthor').textContent = author;
    document.getElementById('infoRepo').textContent = repo;
    document.getElementById('infoFoundation').textContent = foundation;

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

// === Init ===
document.addEventListener('DOMContentLoaded', function() {
    buildCards();
});