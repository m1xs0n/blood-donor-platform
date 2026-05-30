const API_BASE_URL = 'https://blood-donor-platform-production-ebf8.up.railway.app';

const API_URL =
`${API_BASE_URL}/api/requests`;

const token =
localStorage.getItem('token');

const requestUser =
JSON.parse(localStorage.getItem('user') || 'null');

if (!token) {

    window.location.href =
    'login.html';
}

async function createRequest() {

    const title =
    document.getElementById(
        'title'
    ).value;

    const description =
    document.getElementById(
        'description'
    ).value;

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

    const urgency =
    document.getElementById(
        'urgency'
    ).value;

    if (
        !title ||
        !description ||
        !blood_group ||
        !rh_factor ||
        !city
    ) {

        alert(
            'Заповніть всі поля'
        );

        return;
    }

    try {

        const response = await fetch(
            API_URL,
            {
                method: 'POST',

                headers: {

                    'Content-Type':
                    'application/json',

                    Authorization:
                    `Bearer ${token}`
                },

                body: JSON.stringify({
                    title,
                    description,
                    blood_group,
                    rh_factor,
                    city,
                    urgency
                })
            }
        );

        const data =
        await response.json();

        alert(data.message);

        document.getElementById(
            'title'
        ).value = '';

        document.getElementById(
        'description'
    ).value = '';

        document.getElementById(
            'city'
        ).value = '';

    } catch (error) {

        console.log(error);

        alert(
            'Помилка створення заявки'
        );
    }
}

if (requestUser && requestUser.role === 'donor') {

    alert(
        'Створення заявок доступне реципієнтам'
    );

    window.location.href =
    'dashboard.html';
}
