const API_BASE_URL = 'https://blood-donor-platform-pzzi.onrender.com';

const API_URL = `${API_BASE_URL}/api/auth`;

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

function isValidDateOfBirth(dateOfBirth) {

    if (!dateOfBirth) {

        return false;
    }

    const birthDate =
    new Date(dateOfBirth);

    const today =
    new Date();

    return !Number.isNaN(birthDate.getTime()) &&
    birthDate < today;
}

function toggleRegisterRoleFields() {

    const role =
    document.getElementById('role')?.value;

    const donorFields =
    document.getElementById('donor_register_fields');

    if (!donorFields) {

        return;
    }

    donorFields.style.display =
    role === 'donor'
    ? 'block'
    : 'none';
}

async function register() {

    const full_name =
    document.getElementById('full_name').value.trim();

    const email =
    document.getElementById('email').value.trim().toLowerCase();

    const password =
    document.getElementById('password').value;

    const date_of_birth =
    document.getElementById('date_of_birth').value;

    const role =
    document.getElementById('role').value;

    const city =
    document.getElementById('city').value.trim();

    const phone =
    document.getElementById('phone').value.trim();

    const blood_group =
    document.getElementById('blood_group').value;

    const rh_factor =
    document.getElementById('rh_factor').value;

    const missingFields = [];

    if (!full_name) missingFields.push('ПІП');
    if (!date_of_birth) missingFields.push('Дата народження');
    if (!role) missingFields.push('Тип акаунта');
    if (!city) missingFields.push('Місто');
    if (!phone) missingFields.push('Телефон');
    if (!email) missingFields.push('Email');
    if (!password) missingFields.push('Пароль');

    if (missingFields.length > 0) {

        alert(`Заповніть поля: ${missingFields.join(', ')}`);

        return;
    }

    if (
        !full_name ||
        !email ||
        !password ||
        !date_of_birth ||
        !role ||
        !city ||
        !phone
    ) {

        alert(
            'Заповніть всі поля'
        );

        return;
    }

    if (!isValidDateOfBirth(date_of_birth)) {

        alert(
            'Введіть коректну дату народження'
        );

        return;
    }

    if (
        role === 'donor' &&
        (
            !blood_group ||
            !rh_factor
        )
    ) {

        alert(
            'Для донора потрібно вказати групу крові та резус фактор'
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
                password,
                date_of_birth,
                role,
                city,
                phone,
                blood_group,
                rh_factor
            })
        }
    );

    const data =
    await response.json();

    alert(
        data.verificationCode
        ? `${data.message}\nКод: ${data.verificationCode}`
        : data.message
    );

    if (response.ok) {

        localStorage.setItem(
            'verification_email',
            email
        );

        window.location.href = 'verify.html';
    }
}

document.addEventListener(
    'DOMContentLoaded',
    () => {
        toggleRegisterRoleFields();
    }
);

async function verifyEmail() {

    const email =
    localStorage.getItem(
        'verification_email'
    );

    const code =
    document.getElementById(
        'verify_code'
    ).value.trim();

    if (!code) {

        alert('Заповніть поле: Код підтвердження');

        return;
    }

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

        if (data.token && data.user) {

            localStorage.setItem(
                'token',
                data.token
            );

            localStorage.setItem(
                'user',
                JSON.stringify(data.user)
            );

            window.location.href = 'dashboard.html';

            return;
        }

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
