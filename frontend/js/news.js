async function loadNewsList() {
    const container =
    document.getElementById('news_list');

    try {
        const response =
        await fetch(`${API_BASE}/api/news`);

        const news =
        await response.json();

        if (news.length === 0) {
            container.innerHTML = `
                <p class="empty-state">Опублікованих новин поки немає.</p>
            `;
            return;
        }

        container.innerHTML =
        news.map(renderNewsPreviewCard).join('');
    } catch (error) {
        container.innerHTML = `
            <p class="empty-state">Не вдалося завантажити новини.</p>
        `;
    }
}

loadNewsList();
