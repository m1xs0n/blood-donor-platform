const MESSAGES_API =
'http://localhost:5000/api/messages';

const token =
localStorage.getItem('token');

const currentUser =
JSON.parse(localStorage.getItem('user') || 'null');

let conversations = [];

let activeConversation = null;

if (!token) {

    window.location.href =
    'login.html';
}

function escapeHtml(value) {

    return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function conversationKey(conversation) {

    return `${conversation.request_id}:${conversation.other_user_id}`;
}

function daysSince(dateValue) {

    if (!dateValue) {

        return null;
    }

    const date =
    new Date(String(dateValue).slice(0, 10));

    const today =
    new Date();

    return Math.floor(
        (today - date) / (1000 * 60 * 60 * 24)
    );
}

function isBloodCompatible(conversation) {

    const compatibility = {
        I: ['I', 'II', 'III', 'IV'],
        II: ['II', 'IV'],
        III: ['III', 'IV'],
        IV: ['IV']
    };

    const donorGroup =
    String(conversation.other_blood_group || '').toUpperCase();

    const requestGroup =
    String(conversation.request_blood_group || '').toUpperCase();

    const donorRh =
    String(conversation.other_rh_factor || '');

    const requestRh =
    String(conversation.request_rh_factor || '');

    const groupMatches =
    compatibility[donorGroup] &&
    compatibility[donorGroup].includes(requestGroup);

    const rhMatches =
    donorRh === '-' ||
    donorRh === requestRh;

    return Boolean(
        donorGroup &&
        requestGroup &&
        donorRh &&
        requestRh &&
        groupMatches &&
        rhMatches
    );
}

function renderDonorInfo(conversation) {

    const days =
    daysSince(conversation.other_last_donation_date);

    const isTooSoon =
    days !== null &&
    days < 60;

    const compatible =
    isBloodCompatible(conversation);

    const confirmButton =
    currentUser &&
    currentUser.id === conversation.request_creator_id
    ? `
        <button onclick="confirmDonation()">
            Підтвердити отримання крові
        </button>
    `
    : '';

    return `
        <div class="chat-donor-info ${isTooSoon ? 'too-soon' : ''}">
            <div>
                <strong>Донор:</strong>
                ${escapeHtml(conversation.other_user_name || '-')}
            </div>

            <div>
                <strong>Кров донора:</strong>
                ${escapeHtml(conversation.other_blood_group || '-')}${escapeHtml(conversation.other_rh_factor || '')}
            </div>

            <div>
                <strong>Потрібно:</strong>
                ${escapeHtml(conversation.request_blood_group || '-')}${escapeHtml(conversation.request_rh_factor || '')}
            </div>

            <div>
                <strong>Сумісність:</strong>
                ${compatible ? 'підходить' : 'не підходить або дані неповні'}
            </div>

            <div>
                <strong>Остання донація:</strong>
                ${
                    conversation.other_last_donation_date
                    ? `${String(conversation.other_last_donation_date).slice(0, 10)} (${days} дн. тому)`
                    : 'немає даних'
                }
            </div>

            ${
                isTooSoon
                ? '<p>Увага: з останньої донації минуло менше 60 днів.</p>'
                : ''
            }

            ${confirmButton}
        </div>
    `;
}

async function messagesFetch(url, options = {}) {

    return fetch(
        url,
        {
            ...options,

            headers: {
                'Content-Type':
                'application/json',

                Authorization:
                `Bearer ${token}`,

                ...(options.headers || {})
            }
        }
    );
}

async function loadConversations() {

    const response =
    await messagesFetch(
        `${MESSAGES_API}/conversations`
    );

    conversations =
    await response.json();

    renderConversations(conversations);

    const params =
    new URLSearchParams(window.location.search);

    const requestId =
    params.get('requestId');

    const userId =
    params.get('userId');

    if (requestId && userId) {

        const conversation =
        conversations.find((item) => {
            return String(item.request_id) === String(requestId) &&
            String(item.other_user_id) === String(userId);
        });

        if (conversation) {

            openConversation(
                conversationKey(conversation)
            );

            return;
        }
    }

    if (conversations.length > 0 && !activeConversation) {

        openConversation(
            conversationKey(conversations[0])
        );
    }
}

function renderConversations(items) {

    const container =
    document.getElementById(
        'conversations_list'
    );

    if (items.length === 0) {

        container.innerHTML = `
            <div class="conversation-empty">
                Діалогів поки немає
            </div>
        `;

        return;
    }

    container.innerHTML =
    items.map((conversation) => {

        const activeClass =
        activeConversation &&
        conversationKey(activeConversation) === conversationKey(conversation)
        ? 'active'
        : '';

        const unreadBadge =
        conversation.unread_count > 0
        ? `<span>${conversation.unread_count}</span>`
        : '';

        return `
            <button
                class="conversation-item ${activeClass}"
                onclick="openConversation('${conversationKey(conversation)}')"
            >
                <strong>
                    ${escapeHtml(conversation.other_user_name || 'Користувач')}
                    ${unreadBadge}
                </strong>

                <small>
                    ${escapeHtml(conversation.request_title || 'Заявка')}
                </small>

                <p>
                    ${escapeHtml(conversation.last_message || '')}
                </p>
            </button>
        `;

    }).join('');
}

function filterConversations() {

    const search =
    document.getElementById(
        'conversation_search'
    ).value.toLowerCase();

    const filtered =
    conversations.filter((conversation) => {

        return [
            conversation.other_user_name,
            conversation.request_title,
            conversation.last_message
        ]
        .join(' ')
        .toLowerCase()
        .includes(search);

    });

    renderConversations(filtered);
}

async function openConversation(key) {

    activeConversation =
    conversations.find((conversation) => {
        return conversationKey(conversation) === key;
    });

    if (!activeConversation) {

        return;
    }

    renderConversations(conversations);

    document.getElementById(
        'chat_header'
    ).innerHTML = `
        <strong>${escapeHtml(activeConversation.other_user_name || 'Користувач')}</strong>
        <span>${escapeHtml(activeConversation.request_title || 'Заявка')}</span>
        ${renderDonorInfo(activeConversation)}
    `;

    const response =
    await messagesFetch(
        `${MESSAGES_API}/${activeConversation.request_id}/${activeConversation.other_user_id}`
    );

    const messages =
    await response.json();

    renderMessages(messages);
}

function renderMessages(messages) {

    const container =
    document.getElementById(
        'messages_list'
    );

    container.innerHTML =
    messages.map((message) => {

        const isMine =
        currentUser &&
        message.sender_id === currentUser.id;

        return `
            <div class="message-row ${isMine ? 'mine' : 'theirs'}">
                <div class="message-bubble">
                    <p>${escapeHtml(message.message)}</p>
                    <small>${escapeHtml(message.sender_name || '')}</small>
                </div>
            </div>
        `;

    }).join('');

    container.scrollTop =
    container.scrollHeight;
}

async function sendChatMessage() {

    if (!activeConversation) {

        alert(
            'Оберіть діалог'
        );

        return;
    }

    const input =
    document.getElementById(
        'message_input'
    );

    const message =
    input.value.trim();

    if (!message) {

        return;
    }

    const response =
    await messagesFetch(
        MESSAGES_API,
        {
            method: 'POST',

            body: JSON.stringify({
                request_id: activeConversation.request_id,
                receiver_id: activeConversation.other_user_id,
                message
            })
        }
    );

    const data =
    await response.json();

    if (!response.ok) {

        alert(data.message);

        return;
    }

    input.value = '';

    await loadConversations();

    openConversation(
        conversationKey(activeConversation)
    );
}

async function confirmDonation() {

    if (!activeConversation) {

        return;
    }

    const confirmed =
    confirm(
        'Підтвердити, що кров була отримана?'
    );

    if (!confirmed) {

        return;
    }

    const response =
    await messagesFetch(
        `${MESSAGES_API}/confirm-donation`,
        {
            method: 'POST',

            body: JSON.stringify({
                request_id: activeConversation.request_id,
                donor_id: activeConversation.other_user_id
            })
        }
    );

    const data =
    await response.json();

    alert(data.message);

    await loadConversations();
}

loadConversations();
