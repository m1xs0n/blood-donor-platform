const API_URL = 'http://localhost:5000/api/auth';

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {

    return password.length >= 6;
}

function isValidName(fullName) {

    return fullName.length >= 2;
}

function isValidCode(code) {

    return /^\d{6}$/.test(code);
}

async function register() {

    const full_name =
    document.getElementById('full_name').value.trim();

    const email =
    document.getElementById('email').value.trim().toLowerCase();

    const password =
    document.getElementById('password').value;

    if (
        !full_name ||
        !email ||
        !password
    ) {

        alert(
            'Заповніть всі поля'
        );

        return;
    }

    if (!isValidName(full_name)) {

        alert(
            'Імʼя має містити щонайменше 2 символи'
        );

        return;
    }

    if (!isValidEmail(email)) {

        alert(
            'Введіть коректний email'
        );

        return;
    }

    if (!isValidPassword(password)) {

        alert(
            'Пароль має містити щонайменше 6 символів'
        );

        return;
    }

    const response = await fetch(
        `${API_URL}/register`,
        {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                full_name,
                email,
                password
            })
        }
    );

    const data =
    await response.json();

    alert(data.message);

    if (response.ok) {

        localStorage.setItem(
            'verification_email',
            email
        );

        window.location.href = 'verify.html';
    }
}

async function verifyEmail() {

    const email =
    localStorage.getItem(
        'verification_email'
    );

    const code =
    document.getElementById(
        'verify_code'
    ).value.trim();

    if (!email) {

        alert(
            'Спочатку пройдіть реєстрацію'
        );

        window.location.href = 'register.html';

        return;
    }

    if (!code) {

        alert(
            'Введіть код підтвердження'
        );

        return;
    }

    if (!isValidCode(code)) {

        alert(
            'Код має складатися з 6 цифр'
        );

        return;
    }

    const response = await fetch(
        `${API_URL}/verify-email`,
        {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                email,
                code
            })
        }
    );

    const data =
    await response.json();

    alert(data.message);

    if (response.ok) {

        localStorage.removeItem(
            'verification_email'
        );

        window.location.href = 'login.html';
    }
}

async function login() {

    const email =
    document.getElementById('login_email').value.trim().toLowerCase();

    const password =
    document.getElementById('login_password').value;

    if (
        !email ||
        !password
    ) {

        alert(
            'Введіть email і пароль'
        );

        return;
    }

    if (!isValidEmail(email)) {

        alert(
            'Введіть коректний email'
        );

        return;
    }

    const response = await fetch(
        `${API_URL}/login`,
        {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                email,
                password
            })
        }
    );

    const data =
    await response.json();

    alert(data.message);

    if (response.ok) {

        localStorage.setItem(
            'token',
            data.token
        );

        localStorage.setItem(
            'user',
            JSON.stringify(data.user)
        );

        window.location.href = 'dashboard.html';
    }
}
