const NEWS_API =
window.API_BASE_URL ||
(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
    ? 'https://blood-donor-platform-to9r.onrender.com'
    : 'https://blood-donor-platform-to9r.onrender.com'
);

const newsToken =
localStorage.getItem('token');

const newsUser =
JSON.parse(localStorage.getItem('user') || 'null');

let adminNews = [];

let editingNewsId = null;

const canManageNews =
newsToken &&
newsUser &&
newsUser.role === 'admin';

if (
    !newsToken ||
    !newsUser
) {
    alert('Потрібно увійти в акаунт адміністратора');
    window.location.href = 'login.html';
}

if (
    newsUser &&
    newsUser.role !== 'admin'
) {
    alert('Доступ лише для адміністратора');
    window.location.href = 'dashboard.html';
}

function newsValue(value) {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value);
}

function newsEscape(value) {
    return newsValue(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function adminNewsDate(value) {
    if (!value) {
        return '';
    }

    return new Date(value).toLocaleDateString('uk-UA');
}

async function newsFetch(url, options = {}) {
    const response =
    await fetch(
        url,
        {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${newsToken}`,
                ...(options.headers || {})
            }
        }
    );

    if (response.status === 401 || response.status === 403) {
        alert('Немає доступу до керування новинами');
        window.location.href = 'dashboard.html';
        throw new Error('Access denied');
    }

    return response;
}

function renderAdminNews() {
    const container =
    document.getElementById('admin_news_list');

    const search =
    document.getElementById('admin_news_search')
    .value
    .toLowerCase();

    const filtered =
    adminNews.filter((item) => {
        return [
            item.title,
            item.summary,
            item.content,
            item.status
        ].join(' ').toLowerCase().includes(search);
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <p class="empty-state">Новини не знайдено.</p>
        `;
        return;
    }

    container.innerHTML =
    filtered.map((item) => {
        const statusClass =
        item.status === 'published'
        ? 'published'
        : 'draft';

        return `
            <article class="admin-news-card">
                <div>
                    <span class="news-status ${statusClass}">
                        ${item.status === 'published' ? 'Опубліковано' : 'Чернетка'}
                    </span>
                    <h3>${newsEscape(item.title)}</h3>
                    <p>${newsEscape(item.summary || item.content).slice(0, 180)}</p>
                    <small>${adminNewsDate(item.created_at)}</small>
                </div>

                <div class="admin-row-actions">
                    <button onclick="editNews(${item.id})">Редагувати</button>
                    <button class="danger-button" onclick="deleteNews(${item.id})">Видалити</button>
                </div>
            </article>
        `;
    }).join('');
}

async function loadAdminNews() {
    const response =
    await newsFetch(`${NEWS_API}/api/news/admin/all`);

    adminNews =
    await response.json();

    renderAdminNews();
}

function clearNewsForm() {
    editingNewsId = null;

    document.getElementById('news_form').reset();

    document.getElementById('news_status').value =
    'published';

    document.getElementById('news_template').value =
    '';

    document.getElementById('news_image_url').disabled =
    false;

    document.getElementById('news_form_title').innerText =
    'Нова новина';
}

function openNewsForm() {
    clearNewsForm();

    document.getElementById('news_overlay').classList.add('active');
    document.getElementById('news_drawer').classList.add('active');
}

function closeNewsForm() {
    document.getElementById('news_overlay').classList.remove('active');
    document.getElementById('news_drawer').classList.remove('active');
}

function editNews(id) {
    const item =
    adminNews.find((news) => {
        return news.id === id;
    });

    if (!item) {
        return;
    }

    editingNewsId = id;

    document.getElementById('news_form_title').innerText =
    'Редагування новини';

    document.getElementById('news_title').value =
    item.title || '';

    document.getElementById('news_summary').value =
    item.summary || '';

    document.getElementById('news_content').value =
    item.content || '';

    document.getElementById('news_image_url').value =
    item.image_url || '';

    document.getElementById('news_template').value =
    item.image_url && item.image_url.startsWith('template:')
    ? item.image_url
    : '';

    document.getElementById('news_image_url').disabled =
    Boolean(document.getElementById('news_template').value);

    document.getElementById('news_external_url').value =
    item.external_url || '';

    document.getElementById('news_status').value =
    item.status || 'published';

    document.getElementById('news_overlay').classList.add('active');
    document.getElementById('news_drawer').classList.add('active');
}

async function deleteNews(id) {
    if (!confirm('Видалити новину?')) {
        return;
    }

    await newsFetch(
        `${NEWS_API}/api/news/admin/${id}`,
        {
            method: 'DELETE'
        }
    );

    await loadAdminNews();
}

if (canManageNews) {
    document.getElementById('news_form').addEventListener(
        'submit',
        async (event) => {
            event.preventDefault();

        const payload = {
            title: document.getElementById('news_title').value.trim(),
            summary: document.getElementById('news_summary').value.trim(),
            content: document.getElementById('news_content').value.trim(),
            image_url:
            document.getElementById('news_template').value ||
            document.getElementById('news_image_url').value.trim(),
            external_url: document.getElementById('news_external_url').value.trim(),
            status: document.getElementById('news_status').value
        };

            if (!payload.title || !payload.content) {
                alert('Заповніть заголовок і текст новини');
                return;
            }

            const url =
            editingNewsId
            ? `${NEWS_API}/api/news/admin/${editingNewsId}`
            : `${NEWS_API}/api/news/admin`;

            const method =
            editingNewsId
            ? 'PUT'
            : 'POST';

            const response =
            await newsFetch(
                url,
                {
                    method,
                    body: JSON.stringify(payload)
                }
            );

            if (!response.ok) {
                const error =
                await response.json();

                alert(error.message || 'Не вдалося зберегти новину');
                return;
            }

            closeNewsForm();
            await loadAdminNews();
        }
    );

    document.getElementById('admin_news_search').addEventListener(
        'input',
        renderAdminNews
    );

    loadAdminNews();

    document.getElementById('news_template').addEventListener(
        'change',
        () => {
            const template =
            document.getElementById('news_template').value;

            document.getElementById('news_image_url').disabled =
            Boolean(template);
        }
    );
}
