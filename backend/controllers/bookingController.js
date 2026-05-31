const db = require('../config/db');

const getTodayDate = () => {

    const today = new Date();

    const year =
    today.getFullYear();

    const month =
    String(today.getMonth() + 1).padStart(2, '0');

    const day =
    String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const getTomorrowDate = () => {

    const tomorrow = new Date();

    tomorrow.setDate(
        tomorrow.getDate() + 1
    );

    const year =
    tomorrow.getFullYear();

    const month =
    String(tomorrow.getMonth() + 1).padStart(2, '0');

    const day =
    String(tomorrow.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const isTooEarlyDate = (date) => {
    return date < getTomorrowDate();
};

exports.createBooking = (req, res) => {

    const userId = req.user.id;

    const {
        center_id,
        booking_date,
        booking_time,
        request_id
    } = req.body;

    if (
        !center_id ||
        !booking_date ||
        !booking_time
    ) {

        return res.status(400).json({
            message: 'Заповніть всі поля'
        });

    }

    if (isTooEarlyDate(booking_date)) {

        return res.status(400).json({
            message: 'Бронювання доступне тільки з наступного дня'
        });

    }

    const insertBooking = () => {
        db.query(
        `INSERT INTO bookings
        (
            user_id,
            request_id,
            center_id,
            booking_date,
            booking_time
        )
        VALUES (?, ?, ?, ?, ?)`,
        [
            userId,
            request_id || null,
            center_id,
            booking_date,
            booking_time
        ],
        (err) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message: 'Помилка сервера'
                });

            }

            res.json({
                message:
                'Бронювання створено'
            });

        }
    );
    };

    if (request_id) {

        db.query(
            `SELECT hospital_name
             FROM blood_requests
             WHERE id = ?`,
            [request_id],
            (requestErr, requestRows) => {

                if (requestErr) {

                    console.log(requestErr);

                    return res.status(500).json({
                        message: 'Помилка сервера'
                    });

                }

                const requiredCenter =
                requestRows[0] &&
                requestRows[0].hospital_name;

                if (
                    requiredCenter &&
                    String(requiredCenter) !== String(center_id)
                ) {

                    return res.status(400).json({
                        message: 'Для цієї заявки центр крові вже обраний реципієнтом'
                    });

                }

                insertBooking();

            }
        );

        return;

    }

    insertBooking();

};

exports.getBookings = (req, res) => {

    const userId = req.user.id;

    db.query(
        `SELECT
            bookings.*,
            donation_centers.name
            AS center_name

        FROM bookings

        JOIN donation_centers
        ON bookings.center_id =
        donation_centers.id

        WHERE bookings.user_id = ?

        ORDER BY booking_date ASC`,
        [userId],
        (err, results) => {

            if (err) {

                return res.status(500).json({
                    message: 'Помилка сервера'
                });

            }

            res.json(results);

        }
    );

};

exports.updateBooking = (req, res) => {

    const userId = req.user.id;

    const bookingId = req.params.id;

    const {
        center_id,
        booking_date,
        booking_time
    } = req.body;

    if (
        !center_id ||
        !booking_date ||
        !booking_time
    ) {

        return res.status(400).json({
            message: 'Заповніть всі поля'
        });

    }

    if (isTooEarlyDate(booking_date)) {

        return res.status(400).json({
            message: 'Бронювання доступне тільки з наступного дня'
        });

    }

    db.query(
        `UPDATE bookings
         SET
            center_id = ?,
            booking_date = ?,
            booking_time = ?
         WHERE id = ?
         AND user_id = ?`,
        [
            center_id,
            booking_date,
            booking_time,
            bookingId,
            userId
        ],
        (err, result) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message: 'Помилка сервера'
                });

            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    message: 'Бронювання не знайдено'
                });

            }

            res.json({
                message: 'Бронювання оновлено'
            });

        }
    );

};

exports.getCenters = (req, res) => {

    db.query(
        'SELECT * FROM donation_centers',
        (err, results) => {

            if (err) {

                return res.status(500).json({
                    message: 'Помилка сервера'
                });

            }

            res.json(results);

        }
    );

};
