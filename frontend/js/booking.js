const API_BASE_URL = 'https://blood-donor-platform-production-ebf8.up.railway.app';

const API_URL =
`${API_BASE_URL}/api/bookings`;

const token =
localStorage.getItem('token');

if (!token) {

    window.location.href =
    'login.html';

}

const selectedRequest =
localStorage.getItem(
    'selected_request'
);

const DONOR_API_URL =
`${API_BASE_URL}/api/donor/profile`;

const selectedChatRequest =
localStorage.getItem(
    'selected_chat_request'
);

const selectedChatUser =
localStorage.getItem(
    'selected_chat_user'
);

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

function daysBetween(dateValue, todayValue) {

    const first =
    new Date(dateValue);

    const second =
    new Date(todayValue);

    const diff =
    second - first;

    return Math.floor(
        diff / (1000 * 60 * 60 * 24)
    );
}

async function loadDonationWarning() {

    try {

        const response = await fetch(
            DONOR_API_URL,
            {
                headers: {
                    Authorization:
                    `Bearer ${token}`
                }
            }
        );

        const profile =
        await response.json();

        if (!profile.last_donation_date) {

            return;
        }

        const days =
        daysBetween(
            profile.last_donation_date,
            getTodayDate()
        );

        if (days < 60) {

            const warning =
            document.getElementById(
                'donation_interval_warning'
            );

            warning.style.display = 'block';

            warning.innerText =
            `Увага: остання донація була ${days} дн. тому. Рекомендований інтервал - 60 днів.`;

        }

    } catch (error) {

        console.log(error);
    }
}

if (!selectedRequest) {

    alert(
        'Бронювання відкривається після натискання “Допомогти” в заявці'
    );

    window.location.href =
    'bookings-list.html';
} else {

    document.addEventListener(
        'DOMContentLoaded',
        () => {

            document.getElementById(
                'selected_request_text'
            ).innerText =
            `Ви відповідаєте на заявку #${selectedRequest}`;

            document.getElementById(
                'booking_date'
            ).min = getTodayDate();

            loadDonationWarning();

            if (
                selectedChatRequest &&
                selectedChatUser
            ) {

                document.getElementById(
                    'open_chat_button'
                ).style.display = 'block';

            }

        }
    );
}

function openSelectedChat() {

    if (
        !selectedChatRequest ||
        !selectedChatUser
    ) {

        window.location.href =
        'messages.html';

        return;
    }

    window.location.href =
    `messages.html?requestId=${selectedChatRequest}&userId=${selectedChatUser}`;
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

    const select =
    document.getElementById(
        'center_id'
    );

    select.innerHTML = `
        <option value="">
            Оберіть центр донації
        </option>
    `;

    centers.forEach((center) => {

        select.innerHTML += `
            <option value="${center.id}">
                ${center.name}
            </option>
        `;

    });

}

async function createBooking() {

    const center_id =
    document.getElementById(
        'center_id'
    ).value;

    const booking_date =
    document.getElementById(
        'booking_date'
    ).value;

    const booking_time =
    document.getElementById(
        'booking_time'
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
            'Не можна створити бронювання в минулому'
        );

        return;
    }

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
                center_id,
                request_id: selectedRequest,
                booking_date,
                booking_time
            })
        }
    );

    const data =
    await response.json();

    alert(data.message);

    document.getElementById(
        'booking_date'
    ).value = '';

    document.getElementById(
        'booking_time'
    ).value = '';

    localStorage.removeItem(
        'selected_request'
    );

    if (
        selectedChatRequest &&
        selectedChatUser
    ) {

        document.getElementById(
            'open_chat_button'
        ).style.display = 'block';

    }
}

if (selectedRequest) {

    loadCenters();
}
