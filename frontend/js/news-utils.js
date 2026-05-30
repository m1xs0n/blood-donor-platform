const API_BASE =
window.API_BASE_URL ||
(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://blood-donor-platform-8wlh.onrender.com'
);

function valueToText(value) {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value);
}

function escapeHtml(value) {
    return valueToText(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function linkifyText(value) {
    const escaped =
    escapeHtml(value);

    return escaped.replace(
        /(https?:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
}

function formatDate(value) {
    if (!value) {
        return '';
    }

    return new Date(value).toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

function newsImage(news) {
    const template =
    news.image_url && news.image_url.startsWith('template:')
    ? news.image_url.replace('template:', '')
    : '';

    const templateLabels = {
        attention: 'Увага',
        update: 'Оновлення',
        center: 'Новий центр'
    };

    if (template) {
        return `
            <div class="news-placeholder news-template-${escapeHtml(template)}">
                ${templateLabels[template] || 'Новина'}
            </div>
        `;
    }

    if (!news.image_url) {
        return `
            <div class="news-placeholder">
                Новина
            </div>
        `;
    }

    return `
        <img
            src="${escapeHtml(news.image_url)}"
            alt="${escapeHtml(news.title)}"
        >
    `;
}

function renderNewsCard(news) {
    const summary =
    news.summary || news.content || '';

    return `
        <article class="news-card">
            <a class="news-image" href="news-detail.html?id=${news.id}">
                ${newsImage(news)}
            </a>

            <div class="news-card-body">
                <span>${formatDate(news.created_at)}</span>
                <h3>${escapeHtml(news.title)}</h3>
                <p>${escapeHtml(summary).slice(0, 170)}${summary.length > 170 ? '...' : ''}</p>
                <a href="news-detail.html?id=${news.id}">Читати більше</a>
            </div>
        </article>
    `;
}

function renderNewsPreviewCard(news) {
    return `
        <article class="news-card news-card-preview">
            <a class="news-image" href="news-detail.html?id=${news.id}">
                ${newsImage(news)}
            </a>

            <div class="news-card-body">
                <h3>${escapeHtml(news.title)}</h3>
            </div>
        </article>
    `;
}
