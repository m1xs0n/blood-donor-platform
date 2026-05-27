async function loadNewsDetail() {
    const container =
    document.getElementById('news_detail');

    const params =
    new URLSearchParams(window.location.search);

    const id =
    params.get('id');

    if (!id) {
        container.innerHTML = `
            <p class="empty-state">Новину не знайдено.</p>
        `;
        return;
    }

    try {
        const response =
        await fetch(`${API_BASE}/api/news/${id}`);

        if (!response.ok) {
            throw new Error('News not found');
        }

        const news =
        await response.json();

        const sourceLink =
        news.external_url
        ? `
            <a
                class="primary-link-button"
                href="${escapeHtml(news.external_url)}"
                target="_blank"
                rel="noopener noreferrer"
            >
                Відкрити джерело
            </a>
        `
        : '';

        container.innerHTML = `
            <div class="news-detail-media">
                ${newsImage(news)}
            </div>

            <div class="news-detail-content">
                <p class="section-eyebrow">${formatDate(news.created_at)}</p>
                <h1>${escapeHtml(news.title)}</h1>
                ${news.summary ? `<p class="news-lead">${escapeHtml(news.summary)}</p>` : ''}
                <div class="news-text">
                    ${linkifyText(news.content).replaceAll('\n', '<br>')}
                </div>
                ${sourceLink}
            </div>
        `;
    } catch (error) {
        container.innerHTML = `
            <p class="empty-state">Не вдалося завантажити новину.</p>
        `;
    }
}

loadNewsDetail();
