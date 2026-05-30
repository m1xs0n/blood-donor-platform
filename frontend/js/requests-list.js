const API_BASE_URL =
window.API_BASE_URL ||
(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://blood-donor-platform-8wlh.onrender.com'
);

const API_URL =
`${API_BASE_URL}/api/requests`;

const DONOR_API_URL =
`${API_BASE_URL}/api/donor/profile`;

const token =
localStorage.getItem('token');

const currentUser =
JSON.parse(localStorage.getItem('user') || 'null');

let allRequests = [];

let donorProfile = null;

if (!token) {

    window.location.href =
    'login.html';
}

if (currentUser && currentUser.role === 'recipient') {

    const notice =
    document.createElement('div');

    notice.className =
    'request-view-notice';

    notice.innerText =
    'Ви можете переглядати заявки, але відповідати на них можуть лише донори.';

    document.querySelector('.dashboard-container')
    .insertBefore(
        notice,
        document.getElementById('requests_container')
    );
}

function normalizeBloodGroup(value) {

    return String(value || '')
    .trim()
    .toUpperCase();
}

function normalizeRh(value) {

    return String(value || '')
    .trim();
}

function canDonateBlood(donorGroup, requestGroup) {

    const compatibility = {
        I: ['I', 'II', 'III', 'IV'],
        II: ['II', 'IV'],
        III: ['III', 'IV'],
        IV: ['IV']
    };

    return Boolean(
        compatibility[donorGroup] &&
        compatibility[donorGroup].includes(requestGroup)
    );
}

function canDonateRh(donorRh, requestRh) {

    if (!donorRh || !requestRh) {

        return false;
    }

    if (donorRh === '-') {

        return requestRh === '-' ||
        requestRh === '+';
    }

    return donorRh === requestRh;
}

function getRequestCompatibility(request) {

    const donorGroup =
    normalizeBloodGroup(donorProfile?.blood_group);

    const donorRh =
    normalizeRh(donorProfile?.rh_factor);

    const requestGroup =
    normalizeBloodGroup(request.blood_group);

    const requestRh =
    normalizeRh(request.rh_factor);

    if (
        !donorGroup ||
        !donorRh ||
        !requestGroup ||
        !requestRh
    ) {

        return {
            status: 'unknown',
            label: 'Заповніть групу крові та резус у профілі',
            rank: 1
        };
    }

    if (
        canDonateBlood(donorGroup, requestGroup) &&
        canDonateRh(donorRh, requestRh)
    ) {

        return {
            status: 'match',
            label: 'Ваша кров підходить',
            rank: 0
        };
    }

    return {
        status: 'mismatch',
        label: 'Ваша кров не підходить',
        rank: 2
    };
}

function sortRequestsForUser(requests) {

    if (currentUser && currentUser.role === 'recipient') {

        return [...requests].sort((first, second) => {
            return new Date(second.created_at || 0) -
            new Date(first.created_at || 0);
        });
    }

    return [...requests].sort((first, second) => {

        const firstCompatibility =
        getRequestCompatibility(first);

        const secondCompatibility =
        getRequestCompatibility(second);

        if (firstCompatibility.rank !== secondCompatibility.rank) {

            return firstCompatibility.rank -
            secondCompatibility.rank;
        }

        return new Date(second.created_at || 0) -
        new Date(first.created_at || 0);
    });
}

async function loadDonorProfile() {

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

        donorProfile =
        await response.json();

    } catch (error) {

        console.log(error);

        donorProfile = null;
    }
}

async function loadRequests() {

    try {

        if (!currentUser || currentUser.role !== 'recipient') {

            await loadDonorProfile();
        }

        const response = await fetch(
            API_URL,
            {
                headers: {
                    Authorization:
                    `Bearer ${token}`
                }
            }
        );

        const requests =
        await response.json();

        if (!Array.isArray(requests)) {

            allRequests = [];

            renderRequests([]);

            return;
        }

        allRequests = requests;

        filterRequests();

    } catch (error) {

        console.log(error);

        allRequests = [];

        renderRequests([]);
    }
}

function getUrgencyColor(urgency) {

    if (urgency === 'urgent') {

        return '#fb8c00';
    }

    if (urgency === 'critical') {

        return '#e53935';
    }

    return '#43a047';
}

function renderRequests(requests) {

    const container =
    document.getElementById(
        'requests_container'
    );

    container.innerHTML = '';

    if (requests.length === 0) {

        container.innerHTML = `
            <div class="request-card">
                <p>Заявок поки немає</p>
            </div>
        `;

        return;
    }

    sortRequestsForUser(requests).forEach((request) => {

        const compatibility =
        currentUser && currentUser.role === 'recipient'
        ? null
        : getRequestCompatibility(request);

        const urgencyColor =
        getUrgencyColor(request.urgency);

        container.innerHTML += `

            <div class="request-card ${compatibility ? `request-card-${compatibility.status}` : ''}">

                <div class="request-card-header">

                    <h2>
                        ${request.title || 'Заявка'}
                    </h2>

                    <div class="request-badges">

                        <span
                            class="request-urgency"
                            style="background:${urgencyColor};"
                        >
                            ${request.urgency || '-'}
                        </span>

                        ${
                            compatibility
                            ? `
                                <span class="compatibility-badge compatibility-${compatibility.status}">
                                    ${compatibility.label}
                                </span>
                            `
                            : ''
                        }

                    </div>

                </div>

                <p style="margin-top:15px;">
                    ${request.description || '-'}
                </p>

                <p style="margin-top:15px;">
                    Група крові:
                    <strong>
                        ${request.blood_group || '-'}
                    </strong>
                </p>

                <p style="margin-top:10px;">
                    Резус фактор:
                    <strong>
                        ${request.rh_factor || '-'}
                    </strong>
                </p>

                <p style="margin-top:10px;">
                    Пацієнт:
                    <strong>
                        ${request.patient_name || '-'}
                    </strong>
                </p>

                <p style="margin-top:10px;">
                    Місто:
                    <strong>
                        ${request.city || request.patient_city || '-'}
                    </strong>
                </p>

                ${
                    currentUser && currentUser.role === 'recipient'
                    ? `
                        <p class="recipient-request-note">
                            Відповідь на заявку доступна лише донорам.
                        </p>
                    `
                    : `
                        <button
                            style="margin-top:20px;"
                            onclick="respondRequest(${request.id})"
                        >
                            Допомогти
                        </button>
                    `
                }

            </div>
        `;
    });
}

function filterRequests() {

    const search =
    document.getElementById(
        'search_input'
    ).value.toLowerCase();

    const urgency =
    document.getElementById(
        'urgency_filter'
    ).value;

    const filtered =
    allRequests.filter((request) => {

        const searchableText = [
            request.title,
            request.description,
            request.city,
            request.patient_city,
            request.patient_name,
            request.blood_group,
            request.rh_factor
        ]
        .join(' ')
        .toLowerCase();

        const matchesSearch =
        searchableText.includes(search);

        const matchesUrgency =
        urgency === '' ||
        request.urgency === urgency;

        return (
            matchesSearch &&
            matchesUrgency
        );
    });

    renderRequests(filtered);
}

async function respondRequest(requestId) {

    const response = await fetch(
        `${API_URL}/${requestId}/respond`,
        {
            method: 'POST',

            headers: {
                Authorization:
                `Bearer ${token}`
            }
        }
    );

    const data =
    await response.json();

    alert(data.message);

    if (!response.ok) {

        return;
    }

    localStorage.setItem(
        'selected_request',
        data.request_id
    );

    localStorage.setItem(
        'selected_chat_request',
        data.request_id
    );

    localStorage.setItem(
        'selected_chat_user',
        data.other_user_id
    );

    window.location.href =
    'booking.html';
}

loadRequests();
