function navLink(href, text, extra = '') {

    return `
        <a href="${href}" ${extra}>
            ${text}
        </a>
    `;
}

function renderNavbar() {

    const navbar =
    document.createElement('div');

    const user =
    JSON.parse(localStorage.getItem('user') || 'null');

    const role =
    user?.role || 'donor';

    let links = [
        navLink('dashboard.html', 'Кабінет')
    ];

    if (role === 'donor') {

        links = links.concat([
            navLink('requests-list.html', 'Заявки'),
            navLink('bookings-list.html', 'Мої бронювання'),
            navLink('messages.html', 'Повідомлення'),
            navLink('map.html', 'Карта')
        ]);
    }

    if (role === 'recipient') {

        links = links.concat([
            navLink('requests.html', 'Створити заявку'),
            navLink('requests-list.html', 'Заявки'),
            navLink('messages.html', 'Повідомлення'),
            navLink('map.html', 'Карта')
        ]);
    }

    if (role === 'admin') {

        links = links.concat([
            navLink('requests.html', 'Створити заявку'),
            navLink('requests-list.html', 'Заявки'),
            navLink('bookings-list.html', 'Мої бронювання'),
            navLink('messages.html', 'Повідомлення'),
            navLink('map.html', 'Карта'),
            navLink('admin.html', 'Адміністрування'),
            navLink('admin-news.html', 'Контент сайту')
        ]);
    }

    links.push(
        navLink('#', 'Вийти', 'onclick="logout(); return false;"')
    );

    navbar.className = 'navbar';

    navbar.innerHTML = `
        <div class="nav-logo">
            Blood Donor Platform
        </div>

        <div class="nav-links">
            ${links.join('')}
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
