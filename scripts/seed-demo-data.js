require('dotenv').config({ path: './backend/.env' });

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const demoPassword = 'Demo12345';

const demoUserEmails = [
    'olena.donor.demo@example.com',
    'andrii.donor.demo@example.com',
    'mariia.donor.demo@example.com',
    'vasyl.donor.demo@example.com',
    'iryna.donor.demo@example.com',
    'taras.donor.demo@example.com',
    'nataliia.recipient.demo@example.com',
    'petro.recipient.demo@example.com',
    'svitlana.recipient.demo@example.com',
    'roman.recipient.demo@example.com'
];

const centers = [
    ['Київський міський центр крові', 'вул. Максима Берлинського, 12', 'Київ', 50.471411, 30.461620, '+380444680744', 'info@kmck.ua'],
    ['Львівський обласний центр служби крові', 'вул. Пекарська, 65', 'Львів', 49.835210, 24.048850, '+380322757807', 'blood.lviv@example.com'],
    ['Одеська обласна станція переливання крові', 'пров. Бісквітний, 2', 'Одеса', 46.469391, 30.751305, '+380487289044', 'blood.odesa@example.com'],
    ['Дніпропетровська обласна станція переливання крові', 'просп. Богдана Хмельницького, 17', 'Дніпро', 48.428333, 35.030980, '+380567131944', 'blood.dnipro@example.com'],
    ['Харківський обласний центр служби крові', 'вул. Клочківська, 366', 'Харків', 50.032620, 36.195230, '+380577252164', 'blood.kharkiv@example.com'],
    ['Івано-Франківська обласна станція переливання крові', 'вул. Степана Бандери, 23', 'Івано-Франківськ', 48.918390, 24.710260, '+380342752000', 'blood.if@example.com'],
    ['Тернопільський обласний центр служби крові', 'вул. Клінічна, 8', 'Тернопіль', 49.553520, 25.594770, '+380352524444', 'blood.ternopil@example.com'],
    ['Чернівецький обласний центр служби крові', 'вул. Українська, 36', 'Чернівці', 48.292070, 25.936610, '+380372522600', 'blood.cv@example.com'],
    ['Вінницький обласний центр служби крові', 'вул. Пирогова, 48', 'Вінниця', 49.226230, 28.444170, '+380432551560', 'blood.vn@example.com'],
    ['Запорізький обласний центр служби крові', 'вул. Перемоги, 80', 'Запоріжжя', 47.838800, 35.129110, '+380612337321', 'blood.zp@example.com']
];

const demoUsers = [
    { name: 'Олена Ковальчук', email: 'olena.donor.demo@example.com', role: 'donor', group: 'I', rh: '+', dob: '1996-04-12', city: 'Ужгород', phone: '+380501112233', health: 'Протипоказань не зазначено', last: '2026-03-02' },
    { name: 'Андрій Мельник', email: 'andrii.donor.demo@example.com', role: 'donor', group: 'II', rh: '+', dob: '1993-08-21', city: 'Львів', phone: '+380671234501', health: 'Здоровий, доступний у вихідні', last: '2026-02-14' },
    { name: 'Марія Савчук', email: 'mariia.donor.demo@example.com', role: 'donor', group: 'III', rh: '-', dob: '1999-01-19', city: 'Мукачево', phone: '+380931111908', health: 'Постійний донор', last: '2026-04-01' },
    { name: 'Василь Горват', email: 'vasyl.donor.demo@example.com', role: 'donor', group: 'IV', rh: '+', dob: '1988-11-05', city: 'Ужгород', phone: '+380991452010', health: 'Може здавати після роботи', last: '2025-12-20' },
    { name: 'Ірина Бойко', email: 'iryna.donor.demo@example.com', role: 'donor', group: 'I', rh: '-', dob: '1995-07-30', city: 'Київ', phone: '+380631112244', health: 'Регулярний донор', last: '2026-01-25' },
    { name: 'Тарас Романюк', email: 'taras.donor.demo@example.com', role: 'donor', group: 'II', rh: '-', dob: '1991-09-14', city: 'Івано-Франківськ', phone: '+380681234444', health: 'Готовий до термінових донацій', last: '2026-03-18' },
    { name: 'Наталія Шевченко', email: 'nataliia.recipient.demo@example.com', role: 'recipient', city: 'Київ', phone: '+380501010101', dob: '1989-03-06' },
    { name: 'Петро Литвин', email: 'petro.recipient.demo@example.com', role: 'recipient', city: 'Львів', phone: '+380671010202', dob: '1978-12-11' },
    { name: 'Світлана Мороз', email: 'svitlana.recipient.demo@example.com', role: 'recipient', city: 'Одеса', phone: '+380931010303', dob: '1985-05-23' },
    { name: 'Роман Данилюк', email: 'roman.recipient.demo@example.com', role: 'recipient', city: 'Дніпро', phone: '+380991010404', dob: '1990-10-02' }
];

const newsItems = [
    ['Потрібні донори I(-) для термінових заявок', 'У системі зросла кількість запитів на рідкісну групу крові I(-).', 'Просимо донорів із групою I(-) перевірити актуальні заявки у своєму кабінеті. Перед донацією переконайтеся, що минуло достатньо часу після попередньої здачі крові.', 'template:attention'],
    ['На карту додано нові центри здачі крові', 'Оновлено перелік центрів у великих містах України.', 'Адміністратор додав нові центри служби крові до інтерактивної карти. Тепер користувачі можуть швидше знайти найближчий пункт донації та переглянути контактні дані.', 'template:center'],
    ['Як підготуватися до здачі крові', 'Короткі поради для донорів перед візитом до центру крові.', 'За день до донації варто уникати жирної їжі та алкоголю, добре виспатися, а вранці легко поснідати. Із собою потрібно мати документ, що посвідчує особу.', 'template:update'],
    ['Платформа об’єднує донорів і реципієнтів', 'Новий функціонал допомагає швидше координувати допомогу.', 'Після відповіді донора на заявку автоматично створюється діалог між сторонами. Це дозволяє уточнити деталі, домовитися про час та підтвердити отримання крові.', 'template:update'],
    ['Чому важливо оновлювати профіль донора', 'Актуальні дані допомагають правильно підбирати донорів.', 'Група крові, резус-фактор, місто та дата останньої донації використовуються системою для попереджень і зручного пошуку відповідних донорів.', 'template:attention'],
    ['Планова донація допомагає лікарням мати запас крові', 'Регулярні донори підтримують стабільність банку крові.', 'Навіть якщо немає термінової заявки, бронювання донації допомагає центрам крові підтримувати необхідний запас компонентів крові.', 'template:center']
];

const requestTemplates = [
    { email: 'nataliia.recipient.demo@example.com', title: 'Терміново потрібна кров I(-)', group: 'I', rh: '-', city: 'Київ', urgency: 'critical', centerIndex: 0, desc: 'Пацієнту після операції потрібна кров I(-). Бажано відгукнутися сьогодні для узгодження деталей.' },
    { email: 'petro.recipient.demo@example.com', title: 'Потрібна кров II(+) для планового лікування', group: 'II', rh: '+', city: 'Львів', urgency: 'normal', centerIndex: 1, desc: 'Необхідно поповнити запас крові для планового переливання протягом найближчих днів.' },
    { email: 'svitlana.recipient.demo@example.com', title: 'Пошук донора III(-)', group: 'III', rh: '-', city: 'Одеса', urgency: 'urgent', centerIndex: 2, desc: 'Потрібен донор із групою III(-). Час здачі можна погодити через повідомлення.' },
    { email: 'roman.recipient.demo@example.com', title: 'Необхідна кров IV(+) у Дніпрі', group: 'IV', rh: '+', city: 'Дніпро', urgency: 'urgent', centerIndex: 3, desc: 'Пацієнт очікує на переливання, потрібна підтримка донорів із сумісною групою крові.' },
    { email: 'lopopripo@gmail.com', title: 'Потрібні донори I(+) в Ужгороді', group: 'I', rh: '+', city: 'Ужгород', urgency: 'normal', centerIndex: null, desc: 'Потрібно поповнити запас крові першої групи з позитивним резусом.' },
    { email: 'nataliia.recipient.demo@example.com', title: 'Терміновий запит на II(-)', group: 'II', rh: '-', city: 'Київ', urgency: 'critical', centerIndex: 0, desc: 'Потрібен донор II(-) для пацієнта у критичному стані.' }
];

const getOne = async (db, sql, params) => {
    const [rows] = await db.query(sql, params);
    return rows[0] || null;
};

const addDays = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const cleanDemoData = async (db) => {
    const [demoUsers] = await db.query(
        `SELECT id FROM users WHERE email IN (${demoUserEmails.map(() => '?').join(',')})`,
        demoUserEmails
    );

    const userIds = demoUsers.map((user) => user.id);

    if (userIds.length > 0) {
        await db.query('DELETE FROM notifications WHERE sender_id IN (?) OR receiver_id IN (?) OR user_id IN (?)', [userIds, userIds, userIds]);
        await db.query('DELETE FROM bookings WHERE user_id IN (?)', [userIds]);
        await db.query('DELETE FROM blood_requests WHERE created_by IN (?) OR patient_id IN (?)', [userIds, userIds]);
        await db.query('DELETE FROM donors WHERE user_id IN (?)', [userIds]);
        await db.query('DELETE FROM users WHERE id IN (?)', [userIds]);
    }

    await db.query(
        `DELETE FROM notifications
         WHERE request_id IN (
            SELECT id
            FROM blood_requests
            WHERE title IN (${requestTemplates.map(() => '?').join(',')})
         )`,
        requestTemplates.map((request) => request.title)
    );

    await db.query(
        `DELETE FROM bookings
         WHERE request_id IN (
            SELECT id
            FROM blood_requests
            WHERE title IN (${requestTemplates.map(() => '?').join(',')})
         )`,
        requestTemplates.map((request) => request.title)
    );

    await db.query(
        `DELETE FROM blood_requests
         WHERE title IN (${requestTemplates.map(() => '?').join(',')})`,
        requestTemplates.map((request) => request.title)
    );

    await db.query("DELETE FROM donation_centers WHERE email LIKE 'blood.%@example.com' OR email = 'info@kmck.ua'");
    await db.query("DELETE FROM news WHERE image_url IN ('template:attention', 'template:update', 'template:center')");
};

const main = async () => {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        charset: 'utf8mb4'
    });

    await cleanDemoData(db);

    const passwordHash = await bcrypt.hash(demoPassword, 10);
    const userIds = {};
    const centerIds = [];

    for (const center of centers) {
        const [result] = await db.query(
            `INSERT INTO donation_centers (name, address, city, latitude, longitude, phone, email)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            center
        );
        centerIds.push(result.insertId);
    }

    for (const user of demoUsers) {
        const [userResult] = await db.query(
            `INSERT INTO users (full_name, email, password, role, is_verified, verification_code, verification_attempts)
             VALUES (?, ?, ?, ?, 1, NULL, 0)`,
            [user.name, user.email, passwordHash, user.role]
        );

        userIds[user.email] = userResult.insertId;

        await db.query(
            `INSERT INTO donors (user_id, blood_group, rh_factor, date_of_birth, city, phone, health_status, last_donation_date, is_available)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
                userResult.insertId,
                user.role === 'donor' ? user.group : null,
                user.role === 'donor' ? user.rh : null,
                user.dob || null,
                user.city,
                user.phone,
                user.health || (user.role === 'donor' ? 'Дані профілю заповнені' : 'Реципієнт'),
                user.role === 'donor' ? user.last : null
            ]
        );
    }

    const admin = await getOne(db, "SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1", []);
    const adminId = admin ? admin.id : Object.values(userIds)[0];

    for (const news of newsItems) {
        await db.query(
            `INSERT INTO news (title, summary, content, image_url, external_url, status, created_by)
             VALUES (?, ?, ?, ?, NULL, 'published', ?)`,
            [...news, adminId]
        );
    }

    const requestIds = [];

    for (const request of requestTemplates) {
        const creatorId =
        userIds[request.email] ||
        (await getOne(db, 'SELECT id FROM users WHERE email = ?', [request.email]))?.id;

        if (!creatorId) {
            continue;
        }

        const [result] = await db.query(
            `INSERT INTO blood_requests (created_by, patient_id, title, blood_group, rh_factor, hospital_name, city, urgency, description, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
            [
                creatorId,
                creatorId,
                request.title,
                request.group,
                request.rh,
                request.centerIndex === null || request.centerIndex === undefined
                    ? null
                    : centerIds[request.centerIndex],
                request.city,
                request.urgency,
                request.desc
            ]
        );

        requestIds.push(result.insertId);
    }

    const donorEmails =
    demoUsers.filter((user) => user.role === 'donor').map((user) => user.email);

    const bookings = [
        { donor: donorEmails[0], center: centerIds[0], days: 2, time: '09:30:00', status: 'pending', request: requestIds[0] },
        { donor: donorEmails[1], center: centerIds[1], days: 3, time: '11:00:00', status: 'approved', request: requestIds[1] },
        { donor: donorEmails[2], center: centerIds[2], days: 5, time: '13:15:00', status: 'pending', request: requestIds[2] },
        { donor: donorEmails[3], center: centerIds[0], days: 7, time: '10:45:00', status: 'approved', request: requestIds[4] },
        { donor: donorEmails[4], center: centerIds[3], days: 9, time: '12:00:00', status: 'pending', request: requestIds[0] },
        { donor: donorEmails[5], center: centerIds[5], days: 12, time: '14:30:00', status: 'pending', request: requestIds[5] }
    ];

    for (const booking of bookings) {
        await db.query(
            `INSERT INTO bookings (user_id, request_id, center_id, booking_date, booking_time, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userIds[booking.donor], booking.request || null, booking.center, addDays(booking.days), booking.time, booking.status]
        );
    }

    const messages = [
        { donor: donorEmails[0], recipient: 'nataliia.recipient.demo@example.com', request: requestIds[0], texts: ['Доброго дня! Я маю I(-), можу допомогти із заявкою.', 'Дякую, напишіть, будь ласка, коли вам зручно здати кров.', 'Можу забронювати донацію на найближчі дні.'] },
        { donor: donorEmails[1], recipient: 'petro.recipient.demo@example.com', request: requestIds[1], texts: ['Вітаю, моя група II(+), бачу вашу заявку.', 'Доброго дня! Це актуально, будемо вдячні за допомогу.', 'Я оберу Львівський центр крові та забронюю час.'] },
        { donor: donorEmails[2], recipient: 'svitlana.recipient.demo@example.com', request: requestIds[2], texts: ['Маю III(-), можу відгукнутися.', 'Дякую! Після бронювання напишіть час.', 'Добре, повідомлю після запису.'] },
        { donor: donorEmails[5], recipient: 'nataliia.recipient.demo@example.com', request: requestIds[5], texts: ['Маю II(-), готовий допомогти з терміновим запитом.', 'Дякую, очікуємо на підтвердження бронювання.'] }
    ];

    for (const dialog of messages) {
        const donorId = userIds[dialog.donor];
        const recipientId = userIds[dialog.recipient];

        for (let i = 0; i < dialog.texts.length; i += 1) {
            const sender = i % 2 === 0 ? donorId : recipientId;
            const receiver = i % 2 === 0 ? recipientId : donorId;

            await db.query(
                `INSERT INTO notifications (user_id, sender_id, receiver_id, request_id, type, title, message, is_read)
                 VALUES (?, ?, ?, ?, 'message', 'Повідомлення щодо заявки', ?, ?)`,
                [receiver, sender, receiver, dialog.request, dialog.texts[i], i < dialog.texts.length - 1 ? 1 : 0]
            );
        }
    }

    const counts = {};

    for (const table of ['users', 'donors', 'donation_centers', 'news', 'blood_requests', 'bookings', 'notifications']) {
        counts[table] = (await getOne(db, `SELECT COUNT(*) AS count FROM ${table}`, [])).count;
    }

    console.log('DEMO_DATA_READY');
    console.log(JSON.stringify({ demoPassword, counts }, null, 2));

    await db.end();
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
