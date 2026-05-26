const db = require('../config/db');

exports.getCenters = (req, res) => {

    db.query(
        'SELECT * FROM donation_centers',
        (err, results) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message: 'Помилка сервера'
                });

            }

            res.json(results);

        }
    );

};

exports.addCenter = (req, res) => {

    const {
        name,
        address,
        city,
        latitude,
        longitude,
        phone,
        email
    } = req.body;

    db.query(
        `INSERT INTO donation_centers
        (
            name,
            address,
            city,
            latitude,
            longitude,
            phone,
            email
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            name,
            address,
            city,
            latitude,
            longitude,
            phone,
            email
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
                'Центр крові додано'
            });

        }
    );

};