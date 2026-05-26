const API_URL =
'http://localhost:5000/api/donor';

const token =
localStorage.getItem('token');

const user =
JSON.parse(localStorage.getItem('user'));

if (!token) {

    window.location.href =
    'login.html';

}

document.getElementById(
    'welcome_text'
).innerText =
`Вітаємо, ${user.full_name}`;

function renderBloodGroup(data) {

    const bloodGroup =
    data.blood_group || '-';

    const rhFactor =
    data.rh_factor || '';

    document.getElementById(
        'blood_group_text'
    ).innerText =
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

    document.getElementById(
        'full_name'
    ).value = data.full_name || '';

    document.getElementById(
        'email'
    ).value = data.email || '';

    document.getElementById(
        'blood_group'
    ).value = data.blood_group || '';

    document.getElementById(
        'rh_factor'
    ).value = data.rh_factor || '';

    document.getElementById(
        'city'
    ).value = data.city || '';

    document.getElementById(
        'phone'
    ).value = data.phone || '';

    document.getElementById(
        'health_status'
    ).value =
    data.health_status || '';

    renderBloodGroup(data);
}

async function saveProfile() {

    const blood_group =
    document.getElementById(
        'blood_group'
    ).value;

    const rh_factor =
    document.getElementById(
        'rh_factor'
    ).value;

    const city =
    document.getElementById(
        'city'
    ).value.trim();

    const phone =
    document.getElementById(
        'phone'
    ).value.trim();

    const health_status =
    document.getElementById(
        'health_status'
    ).value.trim();

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
        'http://localhost:5000/api/requests',
        {
            headers: {
                Authorization:
                `Bearer ${token}`
            }
        }
    );

    const requests =
    await requestsResponse.json();

    document.getElementById(
        'requests_count'
    ).innerText =
    Array.isArray(requests)
    ? requests.length
    : 0;

    const bookingsResponse =
    await fetch(
        'http://localhost:5000/api/bookings',
        {
            headers: {
                Authorization:
                `Bearer ${token}`
            }
        }
    );

    const bookings =
    await bookingsResponse.json();

    document.getElementById(
        'bookings_count'
    ).innerText =
    Array.isArray(bookings)
    ? bookings.length
    : 0;
}

loadProfile();
loadStats();
