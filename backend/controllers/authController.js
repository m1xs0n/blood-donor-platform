const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const transporter = require('../config/mailer');

require('dotenv').config();

const pendingRegistrations = new Map();

const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPassword = (password) => {
    return String(password || '').length >= 6;
};

const isValidName = (fullName) => {
    return String(fullName || '').trim().length >= 2;
};

const isValidCode = (code) => {
    return /^\d{6}$/.test(code);
};

const isValidRole = (role) => {
    return ['donor', 'recipient'].includes(role);
};

const isValidDateOfBirth = (dateOfBirth) => {
    const birthDate =
    new Date(dateOfBirth);

    const today =
    new Date();

    return Boolean(dateOfBirth) &&
    !Number.isNaN(birthDate.getTime()) &&
    birthDate < today;
};

const sendVerificationCode = async (email, verificationCode) => {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Код підтвердження Blood Donor Platform',
        html: `
            <h2>Підтвердження Email</h2>
            <p>Ваш код підтвердження:</p>
            <h1>${verificationCode}</h1>
            <p>Введіть цей код на сторінці підтвердження.</p>
        `
    });
};

exports.register = async (req, res) => {
    try {

        const {
            full_name,
            email,
            password,
            date_of_birth,
            role,
            city,
            phone,
            blood_group,
            rh_factor
        } = req.body;

        const normalizedEmail =
        String(email || '').trim().toLowerCase();

        const normalizedName =
        String(full_name || '').trim();

        const normalizedRole =
        isValidRole(role)
        ? role
        : 'donor';

        const normalizedCity =
        String(city || '').trim();

        const normalizedPhone =
        String(phone || '').trim();

        const missingFields = [];

        if (!normalizedName) missingFields.push('ПІП');
        if (!normalizedEmail) missingFields.push('Email');
        if (!password) missingFields.push('Пароль');
        if (!date_of_birth) missingFields.push('Дата народження');
        if (!normalizedCity) missingFields.push('Місто');
        if (!normalizedPhone) missingFields.push('Телефон');

        if (
            normalizedRole === 'donor' &&
            !blood_group
        ) {
            missingFields.push('Група крові');
        }

        if (
            normalizedRole === 'donor' &&
            !rh_factor
        ) {
            missingFields.push('Резус фактор');
        }

        if (missingFields.length > 0) {

            return res.status(400).json({
                message: `Заповніть поля: ${missingFields.join(', ')}`
            });

        }

        if (
            !normalizedName ||
            !normalizedEmail ||
            !password ||
            !date_of_birth ||
            !normalizedCity ||
            !normalizedPhone
        ) {

            return res.status(400).json({
                message: 'Заповніть всі поля'
            });

        }

        if (!isValidName(normalizedName)) {

            return res.status(400).json({
                message: 'Імʼя має містити щонайменше 2 символи'
            });

        }

        if (!isValidEmail(normalizedEmail)) {

            return res.status(400).json({
                message: 'Введіть коректний email'
            });

        }

        if (!isValidPassword(password)) {

            return res.status(400).json({
                message: 'Пароль має містити щонайменше 6 символів'
            });

        }

        if (!isValidDateOfBirth(date_of_birth)) {

            return res.status(400).json({
                message: 'Введіть коректну дату народження'
            });

        }

        if (
            normalizedRole === 'donor' &&
            (
                !blood_group ||
                !rh_factor
            )
        ) {

            return res.status(400).json({
                message: 'Для донора потрібно вказати групу крові та резус фактор'
            });

        }

        db.query(
            'SELECT * FROM users WHERE email = ?',
            [normalizedEmail],
            async (err, results) => {

                if (err) {

                    console.log(err);

                    return res.status(500).json({
                        message: 'Помилка сервера'
                    });

                }

                if (
                    results.length > 0 &&
                    results[0].is_verified
                ) {

                    return res.status(400).json({
                        message: 'Email вже існує'
                    });

                }

                const hashedPassword =
                await bcrypt.hash(password, 10);

                const verificationCode =
                generateCode();

                console.log(
                    'Код підтвердження:',
                    verificationCode
                );

                try {

                    await sendVerificationCode(
                        normalizedEmail,
                        verificationCode
                    );

                } catch (mailError) {

                    console.log(mailError);

                    return res.status(500).json({
                        message: 'Не вдалося надіслати код на пошту'
                    });

                }

                pendingRegistrations.set(
                    normalizedEmail,
                    {
                        full_name: normalizedName,
                        email: normalizedEmail,
                        password: hashedPassword,
                        role: normalizedRole,
                        date_of_birth,
                        city: normalizedCity,
                        phone: normalizedPhone,
                        blood_group:
                        normalizedRole === 'donor'
                        ? blood_group
                        : null,
                        rh_factor:
                        normalizedRole === 'donor'
                        ? rh_factor
                        : null,
                        verificationCode
                    }
                );

                if (
                    results.length > 0 &&
                    !results[0].is_verified
                ) {

                    return db.query(
                        'DELETE FROM users WHERE email = ? AND is_verified = false',
                        [normalizedEmail],
                        (deleteErr) => {

                            if (deleteErr) {

                                console.log(deleteErr);

                                return res.status(500).json({
                                    message: 'Помилка сервера'
                                });

                            }

                            res.status(201).json({
                                message: 'Код підтвердження надіслано'
                            });

                        }
                    );

                }

                res.status(201).json({
                    message: 'Код підтвердження надіслано'
                });

            }
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: 'Помилка сервера'
        });

    }
};

exports.verifyEmail = (req, res) => {

    const {
        email,
        code
    } = req.body;

    const normalizedEmail =
    String(email || '').trim().toLowerCase();

    const normalizedCode =
    String(code || '').trim();

    if (!isValidEmail(normalizedEmail)) {

        return res.status(400).json({
            message: 'Введіть коректний email'
        });

    }

    if (!isValidCode(normalizedCode)) {

        return res.status(400).json({
            message: 'Код має складатися з 6 цифр'
        });

    }

    const pendingRegistration =
    pendingRegistrations.get(normalizedEmail);

    if (!pendingRegistration) {

        return res.status(404).json({
            message: 'Спочатку пройдіть реєстрацію'
        });

    }

    if (pendingRegistration.verificationCode !== normalizedCode) {

        return res.status(400).json({
            message: 'Невірний код'
        });

    }

    db.query(
        'SELECT * FROM users WHERE email = ?',
        [normalizedEmail],
        (err, results) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message: 'Помилка сервера'
                });

            }

            if (
                results.length > 0 &&
                results[0].is_verified
            ) {

                pendingRegistrations.delete(normalizedEmail);

                return res.status(400).json({
                    message: 'Email вже існує'
                });

            }

            db.query(
                `INSERT INTO users
                (
                    full_name,
                    email,
                    password,
                    is_verified,
                    verification_code,
                    verification_attempts,
                    role
                )
                VALUES (?, ?, ?, true, NULL, 0, ?)`,
                [
                    pendingRegistration.full_name,
                    pendingRegistration.email,
                    pendingRegistration.password,
                    pendingRegistration.role
                ],
                (insertErr, insertResult) => {

                    if (insertErr) {

                        console.log(insertErr);

                        return res.status(500).json({
                            message: 'Помилка сервера'
                        });

                    }

                    return db.query(
                        `INSERT INTO donors
                        (
                            user_id,
                            blood_group,
                            rh_factor,
                            date_of_birth,
                            city,
                            phone,
                            health_status
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
                            insertResult.insertId,
                            pendingRegistration.blood_group,
                            pendingRegistration.rh_factor,
                            pendingRegistration.date_of_birth,
                            pendingRegistration.city,
                            pendingRegistration.phone,
                            null
                        ],
                        (profileErr) => {

                            if (profileErr) {

                                console.log(profileErr);

                                return res.status(500).json({
                                    message: 'Помилка створення профілю'
                                });

                            }

                            pendingRegistrations.delete(normalizedEmail);

                            const token = jwt.sign(
                                {
                                    id: insertResult.insertId,
                                    role: pendingRegistration.role
                                },
                                process.env.JWT_SECRET,
                                {
                                    expiresIn: '7d'
                                }
                            );

                            return res.json({
                                message: 'Email підтверджено',
                                token,
                                user: {
                                    id: insertResult.insertId,
                                    full_name: pendingRegistration.full_name,
                                    email: pendingRegistration.email,
                                    role: pendingRegistration.role
                                }
                            });

                            res.json({
                                message: 'Email підтверджено'
                            });

                        }
                    );

                    res.json({
                        message: 'Email підтверджено'
                    });

                }
            );

        }
    );

};

exports.login = (req, res) => {

    const {
        email,
        password
    } = req.body;

    const normalizedEmail =
    String(email || '').trim().toLowerCase();

    if (
        !normalizedEmail ||
        !password
    ) {

        return res.status(400).json({
            message: 'Введіть email і пароль'
        });

    }

    if (!isValidEmail(normalizedEmail)) {

        return res.status(400).json({
            message: 'Введіть коректний email'
        });

    }

    db.query(
        'SELECT * FROM users WHERE email = ?',
        [normalizedEmail],
        async (err, results) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message: 'Помилка сервера'
                });

            }

            if (results.length === 0) {

                return res.status(400).json({
                    message: 'Невірний email або пароль'
                });

            }

            const user = results[0];

            if (!user.is_verified) {

                return res.status(401).json({
                    message: 'Підтвердіть email'
                });

            }

            const isMatch =
            await bcrypt.compare(
                password,
                user.password
            );

            if (!isMatch) {

                return res.status(400).json({
                    message: 'Невірний email або пароль'
                });

            }

            const token = jwt.sign(
                {
                    id: user.id,
                    role: user.role
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: '7d'
                }
            );

            res.json({
                message: 'Успішний вхід',
                token,

                user: {
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role
                }
            });

        }
    );

};
