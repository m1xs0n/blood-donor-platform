const ADMIN_API =
'https://blood-donor-platform-to9r.onrender.com/api/admin';

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

let adminReferenceRows = {};

let activeReferenceField = null;

const tableLabels = {
    users: 'Користувачі',
    donors: 'Профілі донорів/реципієнтів',
    blood_requests: 'Заявки на кров',
    bookings: 'Бронювання',
    donation_centers: 'Центри здачі крові',
    notifications: 'Повідомлення',
    hospitals: 'Лікарні',
    news: 'Новини'
};

const fieldLabels = {
    id: 'ID запису',
    user_id: 'ID користувача',
    created_by: 'Автор заявки',
    patient_id: 'Пацієнт / реципієнт',
    full_name: 'ПІП',
    email: 'Email',
    password: 'Пароль',
    role: 'Роль користувача',
    created_at: 'Дата створення',
    updated_at: 'Дата оновлення',
    verification_code: 'Код підтвердження',
    is_verified: 'Email підтверджено',
    verification_attempts: 'Спроби підтвердження',
    blood_group: 'Група крові',
    rh_factor: 'Резус фактор',
    date_of_birth: 'Дата народження',
    city: 'Місто',
    phone: 'Телефон',
    health_status: 'Стан здоровʼя',
    last_donation_date: 'Остання здача крові',
    title: 'Заголовок',
    description: 'Опис',
    urgency: 'Терміновість',
    status: 'Статус',
    request_id: 'Заявка',
    center_id: 'Центр крові',
    booking_date: 'Дата бронювання',
    booking_time: 'Час бронювання',
    name: 'Назва',
    address: 'Адреса',
    latitude: 'Широта',
    longitude: 'Довгота',
    sender_id: 'Відправник',
    receiver_id: 'Отримувач',
    type: 'Тип',
    message: 'Повідомлення',
    summary: 'Короткий опис',
    content: 'Текст',
    image_url: 'Фото / шаблон',
    external_url: 'Посилання'
};

const valueLabels = {
    role: {
        donor: 'Донор',
        recipient: 'Реципієнт',
        admin: 'Адміністратор'
    },
    urgency: {
        normal: 'Низька',
        urgent: 'Середня',
        critical: 'Висока'
    },
    status: {
        pending: 'Очікує',
        confirmed: 'Підтверджено',
        completed: 'Виконано',
        cancelled: 'Скасовано',
        published: 'Опубліковано',
        draft: 'Чернетка'
    },
    type: {
        notification: 'Сповіщення',
        message: 'Повідомлення'
    },
    is_verified: {
        0: 'Ні',
        1: 'Так'
    }
};

valueLabels.is_read = {
    0: 'Ні',
    1: 'Так'
};

const fieldOptions = {
    role: [
        { value: 'donor', label: 'Донор' },
        { value: 'recipient', label: 'Реципієнт' },
        { value: 'admin', label: 'Адміністратор' }
    ],
    blood_group: [
        { value: 'I', label: 'I' },
        { value: 'II', label: 'II' },
        { value: 'III', label: 'III' },
        { value: 'IV', label: 'IV' }
    ],
    rh_factor: [
        { value: '+', label: 'Позитивний (+)' },
        { value: '-', label: 'Негативний (-)' }
    ],
    urgency: [
        { value: 'normal', label: 'Низька' },
        { value: 'urgent', label: 'Середня' },
        { value: 'critical', label: 'Висока' }
    ],
    status: [
        { value: 'pending', label: 'Очікує' },
        { value: 'confirmed', label: 'Підтверджено' },
        { value: 'completed', label: 'Виконано' },
        { value: 'cancelled', label: 'Скасовано' },
        { value: 'published', label: 'Опубліковано' },
        { value: 'draft', label: 'Чернетка' }
    ],
    type: [
        { value: 'notification', label: 'Сповіщення' },
        { value: 'message', label: 'Повідомлення' }
    ],
    is_verified: [
        { value: '0', label: 'Ні' },
        { value: '1', label: 'Так' }
    ]
};

fieldOptions.is_read = [
    { value: '0', label: 'Ні' },
    { value: '1', label: 'Так' }
];

function getFieldOptions(column) {

    if (column.name === 'status') {

        if (currentTable && currentTable.name === 'news') {
            return [
                { value: 'published', label: 'Опубліковано' },
                { value: 'draft', label: 'Чернетка' }
            ];
        }

        if (currentTable && currentTable.name === 'blood_requests') {
            return [
                { value: 'active', label: 'Активна' },
                { value: 'completed', label: 'Виконана' },
                { value: 'cancelled', label: 'Скасована' }
            ];
        }

        if (currentTable && currentTable.name === 'bookings') {
            return [
                { value: 'pending', label: 'Очікує' },
                { value: 'approved', label: 'Підтверджено' },
                { value: 'completed', label: 'Виконано' },
                { value: 'cancelled', label: 'Скасовано' }
            ];
        }
    }

    return fieldOptions[column.name] || null;
}

const referenceFields = {
    user_id: 'users',
    created_by: 'users',
    patient_id: 'users',
    sender_id: 'users',
    receiver_id: 'users',
    request_id: 'blood_requests',
    center_id: 'donation_centers',
    hospital_id: 'hospitals'
};

function getReferenceTable(columnName) {

    return referenceFields[columnName] || null;
}

function getReferenceLabel(tableName, row) {

    if (!row) {

        return '';
    }

    if (tableName === 'users') {

        return row.full_name || row.email || 'Користувач';
    }

    if (tableName === 'blood_requests') {

        return row.title || 'Заявка';
    }

    if (tableName === 'donation_centers' || tableName === 'hospitals') {

        return row.name || 'Запис';
    }

    return row.name || row.title || 'Запис';
}

function getReferenceDisplay(columnName, value) {

    const tableName =
    getReferenceTable(columnName);

    if (!tableName || !value) {

        return valueToText(value);
    }

    const rows =
    adminReferenceRows[tableName] || [];

    const row =
    rows.find((item) => {
        return String(item.id) === String(value);
    });

    if (!row) {

        return valueToText(value);
    }

    return getReferenceLabel(tableName, row);
}

function parseReferenceValue(columnName, value) {

    if (!getReferenceTable(columnName)) {

        return value;
    }

    return value;
}

function getReferenceInputLabel(columnName, value) {

    const label =
    getReferenceDisplay(columnName, value);

    return label || 'Не вибрано';
}

function openReferencePicker(columnName) {

    activeReferenceField =
    columnName;

    const tableName =
    getReferenceTable(columnName);

    if (!tableName) {

        return;
    }

    document.getElementById(
        'admin_reference_title'
    ).innerText =
    `Вибір: ${getFieldLabel(columnName)}`;

    document.getElementById(
        'admin_reference_search'
    ).value = '';

    document.getElementById(
        'admin_reference_modal'
    ).classList.add('active');

    renderReferencePickerRows();
}

function closeReferencePicker() {

    document.getElementById(
        'admin_reference_modal'
    ).classList.remove('active');

    activeReferenceField = null;
}

function renderReferencePickerRows() {

    const container =
    document.getElementById(
        'admin_reference_list'
    );

    const search =
    document.getElementById(
        'admin_reference_search'
    ).value.toLowerCase();

    const tableName =
    getReferenceTable(activeReferenceField);

    const rows =
    adminReferenceRows[tableName] || [];

    const filtered =
    rows.filter((row) => {
        const text = [
            getReferenceLabel(tableName, row),
            row.email,
            row.city,
            row.phone,
            row.title,
            row.name,
            row.id
        ]
        .join(' ')
        .toLowerCase();

        return text.includes(search);
    });

    if (filtered.length === 0) {

        container.innerHTML = `
            <p class="empty-state">Нічого не знайдено.</p>
        `;

        return;
    }

    container.innerHTML =
    filtered.map((row) => {
        const details = [
            row.email,
            row.city,
            row.phone,
            row.address
        ]
        .filter(Boolean)
        .join(' · ');

        return `
            <button
                type="button"
                class="admin-reference-option"
                onclick="selectReferenceValue('${row.id}')"
            >
                <strong>${escapeHtml(getReferenceLabel(tableName, row))}</strong>
                ${details ? `<span>${escapeHtml(details)}</span>` : ''}
            </button>
        `;
    }).join('');
}

function selectReferenceValue(value) {

    const input =
    document.getElementById(
        `admin_field_${activeReferenceField}`
    );

    const label =
    document.getElementById(
        `admin_ref_label_${activeReferenceField}`
    );

    if (!input || !label) {

        closeReferencePicker();

        return;
    }

    input.value =
    value;

    label.value =
    getReferenceInputLabel(
        activeReferenceField,
        value
    );

    closeReferencePicker();
}

function getInputType(column) {

    if (
        column.name.includes('date') ||
        column.type === 'date'
    ) {

        return 'date';
    }

    if (column.name.includes('time')) {

        return 'time';
    }

    if (
        column.type === 'int' ||
        column.type === 'decimal' ||
        column.type === 'float' ||
        column.type === 'double'
    ) {

        return 'number';
    }

    if (column.name === 'email') {

        return 'email';
    }

    return 'text';
}

function renderAdminInput(column, value, isAuto) {

    const referenceTable =
    getReferenceTable(column.name);

    if (referenceTable) {

        const currentValue =
        valueToText(value);

        return `
            <div class="admin-reference-field">
                <input
                    type="text"
                    id="admin_ref_label_${column.name}"
                    value="${escapeHtml(getReferenceInputLabel(column.name, currentValue))}"
                    disabled
                >

                <button
                    type="button"
                    class="secondary-button"
                    onclick="openReferencePicker('${column.name}')"
                    ${isAuto ? 'disabled' : ''}
                >
                    Вибрати
                </button>
            </div>

            <input
                type="hidden"
                id="admin_field_${column.name}"
                value="${escapeHtml(currentValue)}"
                ${isAuto ? 'disabled' : ''}
            >
        `;
    }

    const options =
    getFieldOptions(column);

    if (options) {

        return `
            <select
                id="admin_field_${column.name}"
                ${isAuto ? 'disabled' : ''}
            >
                <option value="">Не вказано</option>
                ${options.map((option) => {
                    const selected =
                    String(value) === String(option.value)
                    ? 'selected'
                    : '';

                    return `
                        <option
                            value="${escapeHtml(option.value)}"
                            ${selected}
                        >
                            ${escapeHtml(option.label)}
                        </option>
                    `;
                }).join('')}
            </select>
        `;
    }

    const inputType =
    getInputType(column);

    return `
        <input
            type="${inputType}"
            id="admin_field_${column.name}"
            value="${escapeHtml(value)}"
            ${isAuto ? 'disabled' : ''}
        >
    `;
}

function getTableLabel(tableName) {

    return tableLabels[tableName] || tableName;
}

function getFieldLabel(fieldName) {

    return fieldLabels[fieldName] || fieldName;
}

function formatAdminValue(columnName, value) {

    if (value === null || value === undefined || value === '') {

        return '';
    }

    const referenceDisplay =
    getReferenceDisplay(columnName, value);

    if (referenceDisplay !== valueToText(value)) {

        return referenceDisplay;
    }

    if (columnName === 'status') {

        const statusOptions =
        getFieldOptions({ name: 'status' }) || [];

        const statusOption =
        statusOptions.find((option) => {
            return String(option.value) === String(value);
        });

        if (statusOption) {

            return statusOption.label;
        }
    }

    const labels =
    valueLabels[columnName];

    if (labels && labels[value] !== undefined) {

        return labels[value];
    }

    if (
        columnName.includes('date') ||
        columnName.endsWith('_at')
    ) {

        const date =
        new Date(value);

        if (!Number.isNaN(date.getTime())) {

            return date.toLocaleString('uk-UA');
        }
    }

    return valueToText(value);
}

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
                ${escapeHtml(getTableLabel(table.name))}
            </button>
        `;

    });
}

async function loadAdminReferences() {

    const referenceTables = [
        'users',
        'blood_requests',
        'donation_centers',
        'hospitals'
    ];

    const availableTables =
    adminTables.map((table) => {
        return table.name;
    });

    await Promise.all(
        referenceTables
        .filter((tableName) => {
            return availableTables.includes(tableName);
        })
        .map(async (tableName) => {
            try {

                const response =
                await adminFetch(
                    `${ADMIN_API}/tables/${encodeURIComponent(tableName)}/rows`
                );

                const data =
                await response.json();

                adminReferenceRows[tableName] =
                data.rows || [];

            } catch (error) {

                console.log(error);

                adminReferenceRows[tableName] = [];
            }
        })
    );
}

async function loadAdminTables() {

    const response =
    await adminFetch(
        `${ADMIN_API}/tables`
    );

    adminTables =
    await response.json();

    await loadAdminReferences();

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
    getTableLabel(tableName);

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

    if (
        [
            'users',
            'blood_requests',
            'donation_centers',
            'hospitals'
        ].includes(currentTable.name)
    ) {

        adminReferenceRows[currentTable.name] =
        currentRows;
    }

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
                        return `<th>${escapeHtml(getFieldLabel(column.name))}</th>`;
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
                                        ${escapeHtml(formatAdminValue(column.name, row[column.name]))}
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
                                    : 'Немає ключового поля'
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

        return currentTable.columns.some((column) => {
            return formatAdminValue(column.name, row[column.name])
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
                ${escapeHtml(getFieldLabel(column.name))}
                <span>${escapeHtml(column.name)}</span>
            </label>

            ${renderAdminInput(column, value, isAuto)}
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
            parseReferenceValue(
                column.name,
                input.value
            );

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
            'У таблиці немає ключового поля'
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
            'У таблиці немає ключового поля'
        );

        return;
    }

    const confirmed =
    confirm(
        `Видалити запис #${row[primaryKey]} з таблиці "${getTableLabel(currentTable.name)}"?`
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
