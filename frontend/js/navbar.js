function renderNavbar() {

    const navbar = document.createElement('div');

    const user =
    JSON.parse(localStorage.getItem('user') || 'null');

    const adminLink =
    user && user.role === 'admin'
    ? `
        <a href="admin.html">
            Адмінка
        </a>
    `
    : '';

    navbar.className = 'navbar';

    navbar.innerHTML = `

    <div class="nav-logo">
        Blood Donor Platform
    </div>

    <div class="nav-links">

        <a href="dashboard.html">
            Dashboard
        </a>

        <a href="requests.html">
            Створити заявку
        </a>

        <a href="requests-list.html">
            Заявки
        </a>

        <a href="bookings-list.html">
            Мої бронювання
        </a>

        <a href="messages.html">
            Повідомлення
        </a>

        <a href="map.html">
            Карта
        </a>

        ${adminLink}

        <a href="#"
           onclick="logout()">
            Вийти
        </a>

    </div>
`;

    document.body.prepend(navbar);
}

function logout() {

    localStorage.removeItem('token');

    localStorage.removeItem('user');

    window.location.href =
    'login.html';
}

document.addEventListener(
    'DOMContentLoaded',
    () => {

        renderNavbar();

    }
);
