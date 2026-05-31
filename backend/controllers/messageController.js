const db = require('../config/db');

const fetchUserMessages = (userId) => {
    return new Promise((resolve, reject) => {

        db.query(
            `SELECT
                notifications.*,
                blood_requests.title AS request_title,
                blood_requests.blood_group AS request_blood_group,
                blood_requests.rh_factor AS request_rh_factor,
                blood_requests.created_by AS request_creator_id,
                sender.full_name AS sender_name,
                receiver.full_name AS receiver_name,
                sender_donor.blood_group AS sender_blood_group,
                sender_donor.rh_factor AS sender_rh_factor,
                sender_donor.last_donation_date AS sender_last_donation_date,
                receiver_donor.blood_group AS receiver_blood_group,
                receiver_donor.rh_factor AS receiver_rh_factor,
                receiver_donor.last_donation_date AS receiver_last_donation_date,
                sender.role AS sender_role,
                receiver.role AS receiver_role
             FROM notifications
             LEFT JOIN blood_requests
             ON notifications.request_id = blood_requests.id
             LEFT JOIN users AS sender
             ON notifications.sender_id = sender.id
             LEFT JOIN users AS receiver
             ON notifications.receiver_id = receiver.id
             LEFT JOIN donors AS sender_donor
             ON notifications.sender_id = sender_donor.user_id
             LEFT JOIN donors AS receiver_donor
             ON notifications.receiver_id = receiver_donor.user_id
             WHERE notifications.type = 'message'
             AND (
                notifications.sender_id = ?
                OR notifications.receiver_id = ?
             )
             ORDER BY notifications.created_at DESC`,
            [
                userId,
                userId
            ],
            (err, rows) => {

                if (err) {
                    reject(err);
                    return;
                }

                resolve(rows);

            }
        );

    });
};

exports.getConversations = async (req, res) => {

    try {

        const userId = req.user.id;

        const rows =
        await fetchUserMessages(userId);

        const conversations = {};

        rows.forEach((row) => {

            const otherUserId =
            row.sender_id === userId
            ? row.receiver_id
            : row.sender_id;

            const otherUserName =
            row.sender_id === userId
            ? row.receiver_name
            : row.sender_name;

            const otherBloodGroup =
            row.sender_id === userId
            ? row.receiver_blood_group
            : row.sender_blood_group;

            const otherRhFactor =
            row.sender_id === userId
            ? row.receiver_rh_factor
            : row.sender_rh_factor;

            const otherLastDonationDate =
            row.sender_id === userId
            ? row.receiver_last_donation_date
            : row.sender_last_donation_date;

            const donorId =
            row.sender_role === 'donor'
            ? row.sender_id
            : row.receiver_id;

            const donorName =
            row.sender_role === 'donor'
            ? row.sender_name
            : row.receiver_name;

            const donorBloodGroup =
            row.sender_role === 'donor'
            ? row.sender_blood_group
            : row.receiver_blood_group;

            const donorRhFactor =
            row.sender_role === 'donor'
            ? row.sender_rh_factor
            : row.receiver_rh_factor;

            const donorLastDonationDate =
            row.sender_role === 'donor'
            ? row.sender_last_donation_date
            : row.receiver_last_donation_date;

            const key =
            `${row.request_id}:${otherUserId}`;

            if (!conversations[key]) {

                conversations[key] = {
                    request_id: row.request_id,
                    request_title: row.request_title,
                    request_blood_group: row.request_blood_group,
                    request_rh_factor: row.request_rh_factor,
                    request_creator_id: row.request_creator_id,
                    other_user_id: otherUserId,
                    other_user_name: otherUserName,
                    other_blood_group: otherBloodGroup,
                    other_rh_factor: otherRhFactor,
                    other_last_donation_date: otherLastDonationDate,
                    donor_id: donorId,
                    donor_name: donorName,
                    donor_blood_group: donorBloodGroup,
                    donor_rh_factor: donorRhFactor,
                    donor_last_donation_date: donorLastDonationDate,
                    last_message: row.message,
                    last_message_at: row.created_at,
                    unread_count: 0
                };

            }

            if (
                row.receiver_id === userId &&
                !row.is_read
            ) {

                conversations[key].unread_count += 1;

            }

        });

        res.json(Object.values(conversations));

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: 'Помилка сервера'
        });

    }
};

exports.getMessages = (req, res) => {

    const userId = req.user.id;

    const {
        requestId,
        otherUserId
    } = req.params;

    db.query(
        `SELECT
            notifications.*,
            sender.full_name AS sender_name,
            receiver.full_name AS receiver_name
         FROM notifications
         LEFT JOIN users AS sender
         ON notifications.sender_id = sender.id
         LEFT JOIN users AS receiver
         ON notifications.receiver_id = receiver.id
         WHERE notifications.type = 'message'
         AND notifications.request_id = ?
         AND (
            (notifications.sender_id = ? AND notifications.receiver_id = ?)
            OR
            (notifications.sender_id = ? AND notifications.receiver_id = ?)
         )
         ORDER BY notifications.created_at ASC`,
        [
            requestId,
            userId,
            otherUserId,
            otherUserId,
            userId
        ],
        (err, rows) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message: 'Помилка сервера'
                });

            }

            db.query(
                `UPDATE notifications
                 SET is_read = true
                 WHERE type = 'message'
                 AND request_id = ?
                 AND sender_id = ?
                 AND receiver_id = ?`,
                [
                    requestId,
                    otherUserId,
                    userId
                ]
            );

            res.json(rows);

        }
    );
};

exports.sendMessage = (req, res) => {

    const userId = req.user.id;

    const {
        request_id,
        receiver_id,
        message
    } = req.body;

    const text =
    String(message || '').trim();

    if (
        !request_id ||
        !receiver_id ||
        !text
    ) {

        return res.status(400).json({
            message: 'Заповніть повідомлення'
        });

    }

    db.query(
        `SELECT id
         FROM notifications
         WHERE type = 'message'
         AND request_id = ?
         AND (
            (sender_id = ? AND receiver_id = ?)
            OR
            (sender_id = ? AND receiver_id = ?)
         )
         LIMIT 1`,
        [
            request_id,
            userId,
            receiver_id,
            receiver_id,
            userId
        ],
        (conversationErr, rows) => {

            if (conversationErr) {

                console.log(conversationErr);

                return res.status(500).json({
                    message: 'Помилка сервера'
                });

            }

            if (rows.length === 0) {

                return res.status(403).json({
                    message: 'Діалог не знайдено'
                });

            }

            db.query(
                `INSERT INTO notifications
                (
                    user_id,
                    sender_id,
                    receiver_id,
                    request_id,
                    type,
                    title,
                    message
                )
                VALUES (?, ?, ?, ?, 'message', ?, ?)`,
                [
                    receiver_id,
                    userId,
                    receiver_id,
                    request_id,
                    'Нове повідомлення',
                    text
                ],
                (messageErr) => {

                    if (messageErr) {

                        console.log(messageErr);

                        return res.status(500).json({
                            message: 'Помилка сервера'
                        });

                    }

                    res.status(201).json({
                        message: 'Повідомлення надіслано'
                    });

                }
            );

        }
    );
};

exports.confirmDonation = (req, res) => {

    const userId = req.user.id;

    const {
        request_id,
        donor_id
    } = req.body;

    if (
        !request_id ||
        !donor_id
    ) {

        return res.status(400).json({
            message: 'Недостатньо даних'
        });

    }

    db.query(
        `SELECT id
         FROM blood_requests
         WHERE id = ?
         AND created_by = ?`,
        [
            request_id,
            userId
        ],
        (requestErr, requestRows) => {

            if (requestErr) {

                console.log(requestErr);

                return res.status(500).json({
                    message: 'Помилка сервера'
                });

            }

            if (requestRows.length === 0) {

                return res.status(403).json({
                    message: 'Підтвердити може лише автор заявки'
                });

            }

            const today =
            new Date().toISOString().slice(0, 10);

            db.query(
                `UPDATE donors
                 SET last_donation_date = ?
                 WHERE user_id = ?`,
                [
                    today,
                    donor_id
                ],
                (donorErr) => {

                    if (donorErr) {

                        console.log(donorErr);

                        return res.status(500).json({
                            message: 'Помилка сервера'
                        });

                    }

                    db.query(
                        `UPDATE bookings
                         SET status = 'completed'
                         WHERE user_id = ?
                         AND request_id = ?`,
                        [
                            donor_id,
                            request_id
                        ]
                    );

                    db.query(
                        `INSERT INTO notifications
                        (
                            user_id,
                            sender_id,
                            receiver_id,
                            request_id,
                            type,
                            title,
                            message
                        )
                        VALUES (?, ?, ?, ?, 'message', ?, ?)`,
                        [
                            donor_id,
                            userId,
                            donor_id,
                            request_id,
                            'Донацію підтверджено',
                            `Кров отримано. Дата останньої донації оновлена: ${today}`
                        ],
                        (messageErr) => {

                            if (messageErr) {

                                console.log(messageErr);

                                return res.status(500).json({
                                    message: 'Помилка сервера'
                                });

                            }

                            res.json({
                                message: 'Донацію підтверджено'
                            });

                        }
                    );

                }
            );

        }
    );
};
