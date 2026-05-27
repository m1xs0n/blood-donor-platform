async function loadHomeNews() {
    const container =
    document.getElementById('home_news');

    try {
        const response =
        await fetch(`${API_BASE}/api/news`);

        const news =
        await response.json();

        const latest =
        news.slice(0, 3);

        if (latest.length === 0) {
            container.innerHTML = `
                <p class="empty-state">Новин поки немає. Адмін може додати їх у панелі.</p>
            `;
            return;
        }

        container.innerHTML =
        latest.map(renderNewsCard).join('');
    } catch (error) {
        container.innerHTML = `
            <p class="empty-state">Не вдалося завантажити новини.</p>
        `;
    }
}

loadHomeNews();
