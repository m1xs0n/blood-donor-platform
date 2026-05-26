const API_URL =
'http://localhost:5000/api/requests';

const token =
localStorage.getItem('token');

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
