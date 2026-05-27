const db = require('../config/db');

exports.createRequest = (req, res) => {

    const userId = req.user.id;

    if (req.user.role === 'donor') {

        return res.status(403).json({
            message: 'Створення заявок доступне реципієнтам'
        });

    }

    const {
        title,
        description,
        blood_group,
        rh_factor,
        city,
        urgency
    } = req.body;

    db.query(
        `INSERT INTO blood_requests
        (
            created_by,
            patient_id,
            title,
            description,
            blood_group,
            rh_factor,
            city,
            urgency
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            userId,
            userId,
            title,
            description,
            blood_group,
            rh_factor,
            city,
            urgency
        ],
        (err) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message: 'Помилка сервера'
                });
            }

            res.json({
                message: 'Заявку створено'
            });
        }
    );
};

exports.getRequests = (req, res) => {

    db.query(
        `SELECT
            blood_requests.*,

            users.full_name
            AS patient_name,

            donors.city
            AS patient_city

        FROM blood_requests

        LEFT JOIN users
        ON blood_requests.patient_id =
        users.id

        LEFT JOIN donors
        ON blood_requests.patient_id =
        donors.user_id

        ORDER BY blood_requests.created_at DESC
        LIMIT 0, 25;`,
        (err, results) => {

            if (err) {

                console.log(err);

                return db.query(
                    `SELECT *
                     FROM blood_requests
                     ORDER BY created_at DESC`,
                    (fallbackErr, fallbackResults) => {

                        if (fallbackErr) {

                            console.log(fallbackErr);

                            return res.status(500).json({
                                message: 'Помилка сервера'
                            });

                        }

                        res.json(fallbackResults);

                    }
                );

            }

            res.json(results);

        }
    );

};

exports.respondToRequest = (req, res) => {

    const requestId = req.params.id;

    const userId = req.user.id;

    if (req.user.role === 'recipient') {

        return res.status(403).json({
            message: 'Відповідати на заявки можуть лише донори'
        });

    }

    db.query(
        `SELECT
            id,
            created_by,
            title
         FROM blood_requests
         WHERE id = ?`,
        [requestId],
        (requestErr, results) => {

            if (requestErr) {

                console.log(requestErr);

                return res.status(500).json({
                    message: 'Помилка сервера'
                });

            }

            if (results.length === 0) {

                return res.status(404).json({
                    message: 'Заявку не знайдено'
                });

            }

            const request = results[0];

            if (request.created_by === userId) {

                return res.status(400).json({
                    message: 'Не можна відповідати на власну заявку'
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
                    requestId,
                    userId,
                    request.created_by,
                    request.created_by,
                    userId
                ],
                (existingErr, existingRows) => {

                    if (existingErr) {

                        console.log(existingErr);

                        return res.status(500).json({
                            message: 'Помилка сервера'
                        });

                    }

                    if (existingRows.length > 0) {

                        return res.json({
                            message: 'Діалог вже існує',
                            request_id: Number(requestId),
                            other_user_id: request.created_by
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
                            request.created_by,
                            userId,
                            request.created_by,
                            requestId,
                            'Новий відгук на заявку',
                            `Донор відгукнувся на заявку: ${request.title || '#' + requestId}`
                        ],
                        (messageErr) => {

                            if (messageErr) {

                                console.log(messageErr);

                                return res.status(500).json({
                                    message: 'Помилка сервера'
                                });

                            }

                            res.json({
                                message: 'Діалог створено',
                                request_id: Number(requestId),
                                other_user_id: request.created_by
                            });

                        }
                    );

                }
            );

        }
    );

};
