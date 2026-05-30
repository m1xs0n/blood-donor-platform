const CENTERS_API =
window.API_BASE_URL ||
(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://blood-donor-platform-to9r.onrender.com'
);

let centers = [];

let centerMarkers = [];

const publicMap =
L.map('public_centers_map').setView(
    [48.6208, 22.2879],
    8
);

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution:
        '&copy; OpenStreetMap contributors'
    }
).addTo(publicMap);

function centerText(value) {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value);
}

function centerHtml(value) {
    return centerText(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderCenters(items) {
    const list =
    document.getElementById('centers_list');

    centerMarkers.forEach((marker) => {
        publicMap.removeLayer(marker);
    });

    centerMarkers = [];

    if (items.length === 0) {
        list.innerHTML = `
            <p class="empty-state">Центри не знайдено.</p>
        `;
        return;
    }

    list.innerHTML =
    items.map((center, index) => {
        return `
            <article
                class="center-card"
                onclick="focusCenter(${index})"
            >
                <h3>${centerHtml(center.name)}</h3>
                <p>${centerHtml(center.city || '')}</p>
                <span>${centerHtml(center.address || '')}</span>
                <small>${centerHtml(center.phone || '')}</small>
            </article>
        `;
    }).join('');

    items.forEach((center) => {
        if (!center.latitude || !center.longitude) {
            return;
        }

        const marker =
        L.marker([
            center.latitude,
            center.longitude
        ]).addTo(publicMap);

        marker.bindPopup(`
            <h3>${centerHtml(center.name)}</h3>
            <p>${centerHtml(center.address || '')}</p>
            <p>${centerHtml(center.phone || '')}</p>
            <p>${centerHtml(center.email || '')}</p>
        `);

        centerMarkers.push(marker);
    });
}

function getFilteredCenters() {
    const search =
    document.getElementById('centers_search')
    .value
    .toLowerCase();

    return centers.filter((center) => {
        const text = [
            center.name,
            center.city,
            center.address,
            center.phone,
            center.email
        ].join(' ').toLowerCase();

        return text.includes(search);
    });
}

function focusCenter(index) {
    const filtered =
    getFilteredCenters();

    const center =
    filtered[index];

    if (!center || !center.latitude || !center.longitude) {
        return;
    }

    publicMap.setView(
        [center.latitude, center.longitude],
        14
    );

    const marker =
    centerMarkers[index];

    if (marker) {
        marker.openPopup();
    }
}

async function loadCenters() {
    try {
        const response =
        await fetch(`${CENTERS_API}/api/map`);

        centers =
        await response.json();

        renderCenters(centers);
    } catch (error) {
        document.getElementById('centers_list').innerHTML = `
            <p class="empty-state">Не вдалося завантажити центри.</p>
        `;
    }
}

document.getElementById('centers_search').addEventListener(
    'input',
    () => {
        renderCenters(getFilteredCenters());
    }
);

loadCenters();
