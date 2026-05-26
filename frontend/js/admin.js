const ADMIN_API =
'http://localhost:5000/api/admin';

const adminToken =
localStorage.getItem('token');

const adminUser =
JSON.parse(localStorage.getItem('user') || 'null');

let adminTables = [];

let currentTable = null;

let currentRows = [];

let editingRow = null;

let adminLocationMap = null;

let adminLocationMarker = null;

let selectedLocation = null;

if (
    !adminToken ||
    !adminUser ||
    adminUser.role !== 'admin'
) {

    alert(
        'Доступ лише для адміністратора'
    );

    window.location.href =
    'dashboard.html';
}

async function adminFetch(url, options = {}) {

    const response = await fetch(
        url,
        {
            ...options,

            headers: {
                'Content-Type':
                'application/json',

                Authorization:
                `Bearer ${adminToken}`,

                ...(options.headers || {})
            }
        }
    );

    if (response.status === 401 || response.status === 403) {

        alert(
            'У вас немає доступу до адмін панелі'
        );

        window.location.href =
        'dashboard.html';

        throw new Error('Admin access denied');
    }

    return response;
}

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

function renderTableButtons() {

    const container =
    document.getElementById(
        'admin_tables'
    );

    if (adminTables.length === 0) {

        container.innerHTML = `
            <p class="empty-state">Таблиці не знайдено.</p>
        `;

        return;
    }

    container.innerHTML = '';

    adminTables.forEach((table) => {

        const activeClass =
        currentTable &&
        currentTable.name === table.name
        ? 'active'
        : '';

        container.innerHTML += `
            <button
                class="admin-table-button ${activeClass}"
                onclick="selectAdminTable('${table.name}')"
            >
                ${escapeHtml(table.name)}
            </button>
        `;

    });
}

async function loadAdminTables() {

    const response =
    await adminFetch(
        `${ADMIN_API}/tables`
    );

    adminTables =
    await response.json();

    renderTableButtons();

    if (adminTables.length > 0) {

        selectAdminTable(
            adminTables[0].name
        );
    }
}

async function selectAdminTable(tableName) {

    currentTable =
    adminTables.find((table) => {
        return table.name === tableName;
    });

    document.getElementById(
        'admin_table_title'
    ).innerText =
    tableName;

    document.getElementById(
        'admin_search'
    ).value = '';

    renderTableButtons();

    await loadCurrentTable();
}

async function loadCurrentTable() {

    if (!currentTable) {

        return;
    }

    const response =
    await adminFetch(
        `${ADMIN_API}/tables/${encodeURIComponent(currentTable.name)}/rows`
    );

    const data =
    await response.json();

    currentTable.columns =
    data.columns;

    currentTable.primaryKey =
    data.primaryKey;

    currentRows =
    data.rows || [];

    renderAdminRows(currentRows);
}

function renderAdminRows(rows) {

    const container =
    document.getElementById(
        'admin_table_container'
    );

    if (!currentTable) {

        container.innerHTML = `
            <p class="empty-state">Оберіть таблицю.</p>
        `;

        return;
    }

    if (rows.length === 0) {

        container.innerHTML = `
            <p class="empty-state">У таблиці немає записів.</p>
        `;

        return;
    }

    const columns =
    currentTable.columns;

    container.innerHTML = `
        <table class="admin-data-table">
            <thead>
                <tr>
                    ${columns.map((column) => {
                        return `<th>${escapeHtml(column.name)}</th>`;
                    }).join('')}
                    <th>Дії</th>
                </tr>
            </thead>

            <tbody>
                ${rows.map((row, index) => {
                    return `
                        <tr>
                            ${columns.map((column) => {
                                return `
                                    <td>
                                        ${escapeHtml(row[column.name])}
                                    </td>
                                `;
                            }).join('')}
                            <td class="admin-row-actions">
                                ${
                                    currentTable.primaryKey
                                    ? `
                                        <button onclick="openAdminForm(${index})">
                                            Редагувати
                                        </button>
                                        <button
                                            class="danger-button"
                                            onclick="deleteAdminRow(${index})"
                                        >
                                            Видалити
                                        </button>
                                    `
                                    : 'Немає primary key'
                                }
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function filterAdminRows() {

    const search =
    document.getElementById(
        'admin_search'
    ).value.toLowerCase();

    const filtered =
    currentRows.filter((row) => {

        return Object.values(row).some((value) => {
            return valueToText(value)
            .toLowerCase()
            .includes(search);
        });

    });

    renderAdminRows(filtered);
}

function openAdminForm(rowIndex = null) {

    if (!currentTable) {

        alert(
            'Спочатку оберіть таблицю'
        );

        return;
    }

    editingRow =
    rowIndex === null
    ? null
    : currentRows[rowIndex];

    document.getElementById(
        'admin_form_title'
    ).innerText =
    editingRow
    ? 'Редагування запису'
    : 'Новий запис';

    const fields =
    document.getElementById(
        'admin_form_fields'
    );

    fields.innerHTML = '';

    currentTable.columns.forEach((column) => {

        const isAuto =
        String(column.extra || '')
        .includes('auto_increment');

        const value =
        editingRow
        ? valueToText(editingRow[column.name])
        : '';

        fields.innerHTML += `
            <label for="admin_field_${column.name}">
                ${escapeHtml(column.name)}
                <span>${escapeHtml(column.type)}</span>
            </label>

            <input
                type="text"
                id="admin_field_${column.name}"
                value="${escapeHtml(value)}"
                ${isAuto ? 'disabled' : ''}
            >
        `;

    });

    if (currentTable.name === 'donation_centers') {

        fields.innerHTML += `
            <button
                class="secondary-button"
                onclick="openLocationPicker()"
                type="button"
            >
                Вибрати точку на карті
            </button>
        `;

    }

    document.getElementById(
        'admin_drawer'
    ).classList.add('active');

    document.getElementById(
        'admin_overlay'
    ).classList.add('active');
}

function getLocationInputValue(fieldName) {

    const input =
    document.getElementById(
        `admin_field_${fieldName}`
    );

    return input
    ? input.value
    : '';
}

function setLocationInputs(lat, lng) {

    const latitudeInput =
    document.getElementById(
        'admin_field_latitude'
    );

    const longitudeInput =
    document.getElementById(
        'admin_field_longitude'
    );

    if (latitudeInput) {

        latitudeInput.value =
        Number(lat).toFixed(8);

    }

    if (longitudeInput) {

        longitudeInput.value =
        Number(lng).toFixed(8);

    }
}

function updateLocationPreview(lat, lng) {

    document.getElementById(
        'admin_location_text'
    ).innerText =
    `Обрано: ${Number(lat).toFixed(8)}, ${Number(lng).toFixed(8)}`;
}

function setMapMarker(lat, lng) {

    selectedLocation = {
        lat,
        lng
    };

    if (adminLocationMarker) {

        adminLocationMarker.setLatLng([
            lat,
            lng
        ]);

    } else {

        adminLocationMarker =
        L.marker([
            lat,
            lng
        ]).addTo(adminLocationMap);

    }

    updateLocationPreview(lat, lng);
}

function openLocationPicker() {

    if (typeof L === 'undefined') {

        alert(
            'Карта не завантажилась. Введіть latitude і longitude вручну.'
        );

        return;
    }

    const latitude =
    parseFloat(
        getLocationInputValue('latitude')
    );

    const longitude =
    parseFloat(
        getLocationInputValue('longitude')
    );

    const startLat =
    Number.isFinite(latitude)
    ? latitude
    : 48.6208;

    const startLng =
    Number.isFinite(longitude)
    ? longitude
    : 22.2879;

    document.getElementById(
        'admin_map_modal'
    ).classList.add('active');

    setTimeout(() => {

        if (!adminLocationMap) {

            adminLocationMap =
            L.map('admin_location_map').setView(
                [
                    startLat,
                    startLng
                ],
                13
            );

            L.tileLayer(
                'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                {
                    attribution:
                    '&copy; OpenStreetMap contributors'
                }
            ).addTo(adminLocationMap);

            adminLocationMap.on(
                'click',
                (event) => {

                    setMapMarker(
                        event.latlng.lat,
                        event.latlng.lng
                    );

                }
            );

        } else {

            adminLocationMap.setView(
                [
                    startLat,
                    startLng
                ],
                13
            );

            adminLocationMap.invalidateSize();
        }

        setMapMarker(
            startLat,
            startLng
        );

        adminLocationMap.invalidateSize();

    }, 100);
}

function closeLocationPicker() {

    document.getElementById(
        'admin_map_modal'
    ).classList.remove('active');
}

function confirmLocationPicker() {

    if (!selectedLocation) {

        alert(
            'Спочатку виберіть точку на карті'
        );

        return;
    }

    setLocationInputs(
        selectedLocation.lat,
        selectedLocation.lng
    );

    closeLocationPicker();
}

function closeAdminForm() {

    document.getElementById(
        'admin_drawer'
    ).classList.remove('active');

    document.getElementById(
        'admin_overlay'
    ).classList.remove('active');
}

function collectAdminFormData() {

    const data = {};

    currentTable.columns.forEach((column) => {

        const input =
        document.getElementById(
            `admin_field_${column.name}`
        );

        if (input && !input.disabled) {

            data[column.name] =
            input.value;

        }

    });

    return data;
}

async function saveAdminRow() {

    const data =
    collectAdminFormData();

    const primaryKey =
    currentTable.primaryKey;

    const isEditing =
    Boolean(editingRow);

    if (isEditing && !primaryKey) {

        alert(
            'У таблиці немає primary key'
        );

        return;
    }

    const url =
    isEditing
    ? `${ADMIN_API}/tables/${encodeURIComponent(currentTable.name)}/rows/${encodeURIComponent(editingRow[primaryKey])}`
    : `${ADMIN_API}/tables/${encodeURIComponent(currentTable.name)}/rows`;

    const response =
    await adminFetch(
        url,
        {
            method: isEditing ? 'PUT' : 'POST',

            body: JSON.stringify(data)
        }
    );

    const result =
    await response.json();

    alert(result.message);

    closeAdminForm();

    loadCurrentTable();
}

async function deleteAdminRow(rowIndex) {

    const row =
    currentRows[rowIndex];

    const primaryKey =
    currentTable.primaryKey;

    if (!primaryKey) {

        alert(
            'У таблиці немає primary key'
        );

        return;
    }

    const confirmed =
    confirm(
        `Видалити запис #${row[primaryKey]} з таблиці ${currentTable.name}?`
    );

    if (!confirmed) {

        return;
    }

    const response =
    await adminFetch(
        `${ADMIN_API}/tables/${encodeURIComponent(currentTable.name)}/rows/${encodeURIComponent(row[primaryKey])}`,
        {
            method: 'DELETE'
        }
    );

    const result =
    await response.json();

    alert(result.message);

    loadCurrentTable();
}

loadAdminTables();
