const db = require('../config/db');

exports.getProfile = (req, res) => {

    const userId = req.user.id;

    db.query(
        `SELECT
            users.id,
            users.full_name,
            users.email,

            donors.blood_group,
            donors.rh_factor,
            donors.date_of_birth,
            donors.city,
            donors.phone,
            donors.health_status,
            donors.last_donation_date,
            users.role

        FROM users

        LEFT JOIN donors
        ON users.id = donors.user_id

        WHERE users.id = ?`,
        [userId],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    message: 'Помилка сервера'
                });
            }

            res.json(results[0]);

        }
    );

};

exports.updateProfile = (req, res) => {

    const userId = req.user.id;

    const {
        blood_group,
        rh_factor,
        date_of_birth,
        city,
        phone,
        health_status,
        last_donation_date
    } = req.body;

    db.query(
        'SELECT * FROM donors WHERE user_id = ?',
        [userId],
        (err, results) => {

            if (results.length === 0) {

                db.query(
                    `INSERT INTO donors
                    (
                        user_id,
                        blood_group,
                        rh_factor,
                        date_of_birth,
                        city,
                        phone,
                        health_status,
                        last_donation_date
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        userId,
                        blood_group,
                        rh_factor,
                        date_of_birth || null,
                        city,
                        phone,
                        health_status,
                        last_donation_date
                    ],
                    (err) => {

                        if (err) {
                            return res.status(500).json({
                                message: 'Помилка сервера'
                            });
                        }

                        res.json({
                            message: 'Профіль створено'
                        });

                    }
                );

            } else {

                db.query(
                    `UPDATE donors
                    SET
                        blood_group = ?,
                        rh_factor = ?,
                        date_of_birth = ?,
                        city = ?,
                        phone = ?,
                        health_status = ?,
                        last_donation_date = ?

                    WHERE user_id = ?`,
                    [
                        blood_group,
                        rh_factor,
                        date_of_birth || null,
                        city,
                        phone,
                        health_status,
                        last_donation_date,
                        userId
                    ],
                    (err) => {

                        if (err) {
                            return res.status(500).json({
                                message: 'Помилка сервера'
                            });
                        }

                        res.json({
                            message: 'Профіль оновлено'
                        });

                    }
                );

            }

        }
    );

};
