const API_BASE_URL =
window.API_BASE_URL ||
(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://blood-donor-platform-8wlh.onrender.com'
);

const API_URL =
`${API_BASE_URL}/api/bookings`;

const token =
localStorage.getItem('token');

let allBookings = [];

let allCenters = [];

if (!token) {

    window.location.href =
    'login.html';

}

function formatDateForInput(dateValue) {

    if (!dateValue) {

        return '';
    }

    return String(dateValue).slice(0, 10);
}

function getTodayDate() {

    const today =
    new Date();

    const year =
    today.getFullYear();

    const month =
    String(today.getMonth() + 1).padStart(2, '0');

    const day =
    String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function formatDateForView(dateValue) {

    const inputDate =
    formatDateForInput(dateValue);

    if (!inputDate) {

        return '-';
    }

    return inputDate
    .split('-')
    .reverse()
    .join('.');
}

function statusLabel(status) {

    const labels = {
        pending: 'Очікує',
        confirmed: 'Підтверджено',
        cancelled: 'Скасовано'
    };

    return labels[status] || status || '-';
}

async function loadCenters() {

    const response = await fetch(
        `${API_URL}/centers`,
        {
            headers: {
                Authorization:
                `Bearer ${token}`
            }
        }
    );

    const centers =
    await response.json();

    allCenters =
    Array.isArray(centers)
    ? centers
    : [];

    const select =
    document.getElementById(
        'edit_center_id'
    );

    select.innerHTML = '';

    allCenters.forEach((center) => {

        select.innerHTML += `
            <option value="${center.id}">
                ${center.name}
            </option>
        `;

    });
}

async function loadBookings() {

    const response = await fetch(
        API_URL,
        {
            headers: {
                Authorization:
                `Bearer ${token}`
            }
        }
    );

    const bookings =
    await response.json();

    allBookings =
    Array.isArray(bookings)
    ? bookings
    : [];

    renderBookings(allBookings);
}

function renderBookings(bookings) {

    const container =
    document.getElementById(
        'bookings_container'
    );

    container.innerHTML = '';

    if (bookings.length === 0) {

        container.innerHTML = `
            <div class="request-card">
                <p>Бронювань поки немає</p>
            </div>
        `;

        return;
    }

    bookings.forEach((booking) => {

        container.innerHTML += `
            <div class="request-card booking-card">

                <div>

                    <h3>
                        ${booking.center_name || 'Центр донації'}
                    </h3>

                    <p>
                        Дата:
                        <strong>
                            ${formatDateForView(booking.booking_date)}
                        </strong>
                    </p>

                    <p>
                        Час:
                        <strong>
                            ${booking.booking_time || '-'}
                        </strong>
                    </p>

                    <p>
                        Статус:
                        <strong>
                            ${statusLabel(booking.status)}
                        </strong>
                    </p>

                </div>

                <button
                    class="edit-booking-button"
                    onclick="openBookingDrawer(${booking.id})"
                >
                    Змінити
                </button>

            </div>
        `;

    });
}

function filterBookings() {

    const search =
    document.getElementById(
        'booking_search'
    ).value.toLowerCase();

    const status =
    document.getElementById(
        'booking_status_filter'
    ).value;

    const date =
    document.getElementById(
        'booking_date_filter'
    ).value;

    const filtered =
    allBookings.filter((booking) => {

        const centerName =
        (booking.center_name || '').toLowerCase();

        const bookingStatus =
        (booking.status || '').toLowerCase();

        const matchesSearch =
        centerName.includes(search) ||
        bookingStatus.includes(search) ||
        statusLabel(booking.status)
        .toLowerCase()
        .includes(search);

        const matchesStatus =
        !status ||
        booking.status === status;

        const matchesDate =
        !date ||
        formatDateForInput(booking.booking_date) === date;

        return (
            matchesSearch &&
            matchesStatus &&
            matchesDate
        );
    });

    renderBookings(filtered);
}

function openBookingDrawer(bookingId) {

    const booking =
    allBookings.find((item) => {

        return item.id === bookingId;
    });

    if (!booking) {

        return;
    }

    document.getElementById(
        'edit_booking_id'
    ).value = booking.id;

    document.getElementById(
        'edit_center_id'
    ).value = booking.center_id;

    document.getElementById(
        'edit_booking_date'
    ).min =
    getTodayDate();

    document.getElementById(
        'edit_booking_date'
    ).value =
    formatDateForInput(booking.booking_date);

    document.getElementById(
        'edit_booking_time'
    ).value =
    String(booking.booking_time || '')
    .slice(0, 5);

    document.getElementById(
        'booking_drawer'
    ).classList.add('active');

    document.getElementById(
        'drawer_overlay'
    ).classList.add('active');
}

function closeBookingDrawer() {

    document.getElementById(
        'booking_drawer'
    ).classList.remove('active');

    document.getElementById(
        'drawer_overlay'
    ).classList.remove('active');
}

async function saveBookingChanges() {

    const bookingId =
    document.getElementById(
        'edit_booking_id'
    ).value;

    const center_id =
    document.getElementById(
        'edit_center_id'
    ).value;

    const booking_date =
    document.getElementById(
        'edit_booking_date'
    ).value;

    const booking_time =
    document.getElementById(
        'edit_booking_time'
    ).value;

    if (
        !center_id ||
        !booking_date ||
        !booking_time
    ) {

        alert(
            'Заповніть всі поля'
        );

        return;
    }

    if (booking_date < getTodayDate()) {

        alert(
            'Не можна перенести бронювання в минуле'
        );

        return;
    }

    const response = await fetch(
        `${API_URL}/${bookingId}`,
        {
            method: 'PUT',

            headers: {
                'Content-Type':
                'application/json',

                Authorization:
                `Bearer ${token}`
            },

            body: JSON.stringify({
                center_id,
                booking_date,
                booking_time
            })
        }
    );

    const data =
    await response.json();

    alert(data.message);

    closeBookingDrawer();

    loadBookings();
}

async function initBookingsPage() {

    await loadCenters();

    await loadBookings();
}

initBookingsPage();
