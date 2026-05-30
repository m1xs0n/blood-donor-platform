
const map = L.map('map').setView(
    [48.6208, 22.2879],
    8
);

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution:
        '&copy; OpenStreetMap contributors'
    }
).addTo(map);

async function loadCenters() {
    const apiBaseUrl = 'https://blood-donor-platform-pzzi.onrender.com';

    const response = await fetch(
        `${apiBaseUrl}/api/map`
    );

    const centers = await response.json();

    centers.forEach((center) => {

        const marker = L.marker([
            center.latitude,
            center.longitude
        ]).addTo(map);

        marker.bindPopup(`
            <h3>${center.name}</h3>

            <p>
                ${center.address}
            </p>

            <p>
                ${center.phone}
            </p>

            <p>
                ${center.email}
            </p>
        `);

    });

}

loadCenters();
