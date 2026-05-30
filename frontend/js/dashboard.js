const API_BASE_URL = 'https://blood-donor-platform-production-ebf8.up.railway.app';

const API_URL =
`${API_BASE_URL}/api/donor`;

const token =
localStorage.getItem('token');

const user =
JSON.parse(localStorage.getItem('user') || 'null');

if (!token || !user) {

    window.location.href =
    'login.html';
}

function getRole() {

    return user?.role || 'donor';
}

function hideElement(id) {

    const element =
    document.getElementById(id);

    if (element) {

        element.style.display = 'none';
    }
}

function showElement(id) {

    const element =
    document.getElementById(id);

    if (element) {

        element.style.display = '';
    }
}

function setupDashboardByRole() {

    const role =
    getRole();

    document.getElementById(
        'welcome_text'
    ).innerText =
    `Вітаємо, ${user.full_name}`;

    if (role === 'recipient') {

        document.getElementById(
            'dashboard_role_title'
        ).innerText =
        'Кабінет реципієнта';

        document.getElementById(
            'dashboard_intro'
        ).innerText =
        'Створюйте заявки на кров, переглядайте повідомлення та координуйте допомогу.';

        document.getElementById(
            'hero_requests_button'
        ).innerText =
        'Створити заявку';

        document.getElementById(
            'hero_requests_button'
        ).onclick = () => {
            window.location.href = 'requests.html';
        };

        hideElement('donor_profile_section');
        hideElement('bookings_stat');
        hideElement('blood_stat');
        hideElement('quick_bookings');

        document.getElementById(
            'dashboard_note_text'
        ).innerText =
        'Створіть заявку та очікуйте відповіді від донора. Після відповіді діалог зʼявиться у повідомленнях.';

        return;
    }

    if (role === 'admin') {

        document.getElementById(
            'dashboard_role_title'
        ).innerText =
        'Кабінет адміністратора';

        document.getElementById(
            'dashboard_intro'
        ).innerText =
        'Керуйте заявками, повідомленнями, картою, новинами та адміністративними даними системи.';

        hideElement('donor_profile_section');
        hideElement('blood_stat');

        showElement('quick_create_request');
        showElement('quick_requests_list');
        showElement('quick_bookings');

        document.getElementById(
            'dashboard_note_text'
        ).innerText =
        'Адміністратор має доступ до всіх основних розділів, керування БД та новин сайту.';

        return;
    }

    document.getElementById(
        'dashboard_role_title'
    ).innerText =
    'Кабінет донора';

    document.getElementById(
        'dashboard_intro'
    ).innerText =
    'Переглядайте заявки, відповідайте на потреби крові та відстежуйте свої бронювання.';

    hideElement('quick_create_request');
}

function renderBloodGroup(data) {

    const bloodGroup =
    data.blood_group || '-';

    const rhFactor =
    data.rh_factor || '';

    const bloodText =
    document.getElementById('blood_group_text');

    if (!bloodText) {

        return;
    }

    bloodText.innerText =
    rhFactor
    ? `${bloodGroup}${rhFactor}`
    : bloodGroup;
}

async function loadProfile() {

    const response = await fetch(
        `${API_URL}/profile`,
        {
            headers: {
                Authorization:
                `Bearer ${token}`
            }
        }
    );

    const data =
    await response.json();

    if (getRole() !== 'donor') {

        return;
    }

    document.getElementById('full_name').value =
    data.full_name || '';

    document.getElementById('email').value =
    data.email || '';

    document.getElementById('date_of_birth').value =
    data.date_of_birth
    ? String(data.date_of_birth).slice(0, 10)
    : '';

    document.getElementById('blood_group').value =
    data.blood_group || '';

    document.getElementById('rh_factor').value =
    data.rh_factor || '';

    document.getElementById('city').value =
    data.city || '';

    document.getElementById('phone').value =
    data.phone || '';

    document.getElementById('health_status').value =
    data.health_status || '';

    renderBloodGroup(data);
}

async function saveProfile() {

    if (getRole() !== 'donor') {

        return;
    }

    const blood_group =
    document.getElementById('blood_group').value;

    const rh_factor =
    document.getElementById('rh_factor').value;

    const date_of_birth =
    document.getElementById('date_of_birth').value;

    const city =
    document.getElementById('city').value.trim();

    const phone =
    document.getElementById('phone').value.trim();

    const health_status =
    document.getElementById('health_status').value.trim();

    const response = await fetch(
        `${API_URL}/profile`,
        {
            method: 'PUT',

            headers: {
                'Content-Type':
                'application/json',

                Authorization:
                `Bearer ${token}`
            },

            body: JSON.stringify({
                blood_group,
                rh_factor,
                date_of_birth,
                city,
                phone,
                health_status
            })
        }
    );

    const data =
    await response.json();

    alert(data.message);

    renderBloodGroup({
        blood_group,
        rh_factor
    });
}

async function loadStats() {

    const requestsResponse =
    await fetch(
        `${API_BASE_URL}/api/requests`,
        {
            headers: {
                Authorization:
                `Bearer ${token}`
            }
        }
    );

    const requests =
    await requestsResponse.json();

    document.getElementById('requests_count').innerText =
    Array.isArray(requests)
    ? requests.length
    : 0;

    if (getRole() === 'recipient') {

        return;
    }

    const bookingsResponse =
    await fetch(
        `${API_BASE_URL}/api/bookings`,
        {
            headers: {
                Authorization:
                `Bearer ${token}`
            }
        }
    );

    const bookings =
    await bookingsResponse.json();

    document.getElementById('bookings_count').innerText =
    Array.isArray(bookings)
    ? bookings.length
    : 0;
}

setupDashboardByRole();
loadProfile();
loadStats();
