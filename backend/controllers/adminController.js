const db = require('../config/db');
const bcrypt = require('bcrypt');

const adminFieldLabels = {
    id: 'ID запису',
    user_id: 'ID користувача',
    created_by: 'Автор заявки',
    patient_id: 'Пацієнт / реципієнт',
    hospital_name: 'Центр крові',
    full_name: 'ПІП',
    email: 'Email',
    password: 'Пароль',
    role: 'Роль користувача',
    created_at: 'Дата створення',
    updated_at: 'Дата оновлення',
    verification_code: 'Код підтвердження',
    is_verified: 'Email підтверджено',
    verification_attempts: 'Спроби підтвердження',
    blood_group: 'Група крові',
    rh_factor: 'Резус фактор',
    date_of_birth: 'Дата народження',
    city: 'Місто',
    phone: 'Телефон',
    health_status: 'Стан здоровʼя',
    last_donation_date: 'Остання здача крові',
    title: 'Заголовок',
    description: 'Опис',
    urgency: 'Терміновість',
    status: 'Статус',
    request_id: 'Заявка',
    center_id: 'Центр крові',
    booking_date: 'Дата бронювання',
    booking_time: 'Час бронювання',
    name: 'Назва',
    address: 'Адреса',
    latitude: 'Широта',
    longitude: 'Довгота',
    sender_id: 'Відправник',
    receiver_id: 'Отримувач',
    type: 'Тип',
    message: 'Повідомлення',
    is_read: 'Прочитано',
    summary: 'Короткий опис',
    content: 'Текст',
    image_url: 'Фото / шаблон',
    external_url: 'Посилання'
};

const getFieldLabel = (fieldName) => {
    return adminFieldLabels[fieldName] || fieldName;
};

const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
};

const isValidPassword = (password) => {
    return String(password || '').length >= 6;
};

const getSchema = () => {
    return new Promise((resolve, reject) => {

        db.query(
            `SELECT
                TABLE_NAME AS tableName,
                COLUMN_NAME AS columnName,
                DATA_TYPE AS dataType,
                COLUMN_KEY AS columnKey,
                EXTRA AS extra,
                COLUMN_DEFAULT AS columnDefault,
                IS_NULLABLE AS isNullable
             FROM information_schema.columns
             WHERE TABLE_SCHEMA = DATABASE()
             ORDER BY TABLE_NAME, ORDINAL_POSITION`,
            (err, rows) => {

                if (err) {
                    reject(err);
                    return;
                }

                const schema = {};

                rows.forEach((row) => {

                    if (!schema[row.tableName]) {

                        schema[row.tableName] = {
                            columns: [],
                            primaryKey: null
                        };

                    }

                    schema[row.tableName].columns.push({
                        name: row.columnName,
                        type: row.dataType,
                        key: row.columnKey,
                        extra: row.extra,
                        defaultValue: row.columnDefault,
                        nullable: row.isNullable
                    });

                    if (row.columnKey === 'PRI') {

                        schema[row.tableName].primaryKey =
                        row.columnName;

                    }

                });

                resolve(schema);

            }
        );

    });
};

const ensureTable = async (tableName) => {

    const schema =
    await getSchema();

    if (!schema[tableName]) {

        const error = new Error('Таблицю не знайдено');
        error.status = 404;
        throw error;

    }

    return schema[tableName];
};

const isAutoManagedColumn = (column) => {
    const columnName =
    String(column.name || '').toLowerCase();

    const extra =
    String(column.extra || '').toLowerCase();

    const defaultValue =
    String(column.defaultValue || '').toLowerCase();

    return columnName === 'created_at' ||
    columnName === 'updated_at' ||
    extra.includes('auto_increment') ||
    extra.includes('on update') ||
    defaultValue.includes('current_timestamp');
};

const formatDateTimeForMysql = (value) => {

    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {

        return null;

    }

    const date =
    new Date(value);

    if (Number.isNaN(date.getTime())) {

        return value;

    }

    const pad = (number) => {
        return String(number).padStart(2, '0');
    };

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const normalizeValueForColumn = (column, value) => {

    if (value === '') {

        return null;

    }

    if (
        column.type === 'datetime' ||
        column.type === 'timestamp'
    ) {

        return formatDateTimeForMysql(value);

    }

    if (column.type === 'date') {

        if (
            value === null ||
            value === undefined
        ) {

            return null;

        }

        return String(value).slice(0, 10);

    }

    return value;
};

const filterWritableData = (tableSchema, data) => {

    const allowedColumns =
    tableSchema.columns
    .filter((column) => {
        return !isAutoManagedColumn(column);
    })
    .reduce((columns, column) => {

        columns[column.name] =
        column;

        return columns;

    }, {});

    const filtered = {};

    Object.keys(data || {}).forEach((key) => {

        if (allowedColumns[key]) {

            filtered[key] =
            normalizeValueForColumn(
                allowedColumns[key],
                data[key]
            );

        }

    });

    return filtered;
};

const isEmptyAdminValue = (value) => {
    return value === null ||
    value === undefined ||
    value === '';
};

const getMissingRequiredFields = (tableSchema, data) => {
    return tableSchema.columns.filter((column) => {

        if (isAutoManagedColumn(column)) {

            return false;

        }

        if (
            column.nullable !== 'NO' ||
            column.defaultValue !== null
        ) {

            return false;

        }

        return isEmptyAdminValue(data[column.name]);

    }).map((column) => {
        return getFieldLabel(column.name);
    });
};

const getEmptyRequiredFieldsFromData = (tableSchema, data) => {
    return tableSchema.columns.filter((column) => {

        if (
            column.nullable !== 'NO' ||
            !Object.prototype.hasOwnProperty.call(data, column.name)
        ) {

            return false;

        }

        return isEmptyAdminValue(data[column.name]);

    }).map((column) => {
        return getFieldLabel(column.name);
    });
};

const getDatabaseErrorMessage = (err) => {

    if (!err) {

        return 'Помилка сервера';

    }

    const sqlMessage =
    err.sqlMessage || err.message || '';

    const fieldMatch =
    sqlMessage.match(/(?:Column|Field) '([^']+)'/);

    const fieldName =
    fieldMatch ? fieldMatch[1] : null;

    const fieldLabel =
    fieldName ? getFieldLabel(fieldName) : null;

    if (
        err.code === 'ER_BAD_NULL_ERROR' ||
        err.code === 'ER_NO_DEFAULT_FOR_FIELD'
    ) {

        return fieldLabel
        ? `Заповніть поле: ${fieldLabel}`
        : 'Заповніть обовʼязкові поля';

    }

    if (err.code === 'ER_DUP_ENTRY') {

        return 'Такий запис уже існує. Перевірте унікальні поля, наприклад email або ID.';

    }

    if (
        err.code === 'ER_NO_REFERENCED_ROW' ||
        err.code === 'ER_NO_REFERENCED_ROW_2'
    ) {

        return 'Обраний повʼязаний запис не існує. Перевірте вибір користувача, заявки або центру крові.';

    }

    if (
        err.code === 'ER_TRUNCATED_WRONG_VALUE' ||
        err.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' ||
        err.code === 'ER_WRONG_VALUE_FOR_TYPE'
    ) {

        return fieldLabel
        ? `Некоректне значення для поля: ${fieldLabel}`
        : 'Некоректне значення в одному з полів';

    }

    if (err.code === 'ER_DATA_TOO_LONG') {

        return fieldLabel
        ? `Значення для поля "${fieldLabel}" занадто довге`
        : 'Одне зі значень занадто довге';

    }

    return err.status
    ? err.message
    : 'Помилка сервера';
};

const prepareAdminData = async (
    tableName,
    data,
    isEditing
) => {

    if (tableName !== 'users') {

        return data;

    }

    if (Object.prototype.hasOwnProperty.call(data, 'email')) {

        const normalizedEmail =
        String(data.email || '').trim().toLowerCase();

        if (!isValidEmail(normalizedEmail)) {

            const error =
            new Error('Введіть коректний email');

            error.status = 400;
            throw error;

        }

        data.email =
        normalizedEmail;

    }

    if (Object.prototype.hasOwnProperty.call(data, 'password')) {

        if (isEditing && isEmptyAdminValue(data.password)) {

            delete data.password;
            return data;

        }

        if (!isValidPassword(data.password)) {

            const error =
            new Error('Пароль має містити щонайменше 6 символів');

            error.status = 400;
            throw error;

        }

        data.password =
        await bcrypt.hash(data.password, 10);

    }

    return data;
};

const handleError = (res, err) => {

    console.log(err);

    res.status(err.status || 500).json({
        message: getDatabaseErrorMessage(err)
    });
};

exports.getAdminInfo = (req, res) => {

    res.json({
        message: 'Адмін доступ підтверджено',
        user: req.user
    });

};

exports.getTables = async (req, res) => {

    try {

        const schema =
        await getSchema();

        res.json(
            Object.keys(schema).map((tableName) => {

                return {
                    name: tableName,
                    primaryKey: schema[tableName].primaryKey,
                    columns: schema[tableName].columns
                };

            })
        );

    } catch (err) {

        handleError(res, err);

    }
};

exports.getRows = async (req, res) => {

    try {

        const tableName =
        req.params.table;

        const tableSchema =
        await ensureTable(tableName);

        const tableId =
        db.escapeId(tableName);

        db.query(
            `SELECT *
             FROM ${tableId}`,
            (err, rows) => {

                if (err) {
                    handleError(res, err);
                    return;
                }

                res.json({
                    table: tableName,
                    primaryKey: tableSchema.primaryKey,
                    columns: tableSchema.columns,
                    rows
                });

            }
        );

    } catch (err) {

        handleError(res, err);

    }
};

exports.createRow = async (req, res) => {

    try {

        const tableName =
        req.params.table;

        const tableSchema =
        await ensureTable(tableName);

        let data =
        filterWritableData(tableSchema, req.body);

        const missingFields =
        getMissingRequiredFields(tableSchema, data);

        if (missingFields.length > 0) {

            return res.status(400).json({
                message: `Заповніть поля: ${missingFields.join(', ')}`
            });

        }

        data =
        await prepareAdminData(
            tableName,
            data,
            false
        );

        const columns =
        Object.keys(data);

        if (columns.length === 0) {

            return res.status(400).json({
                message: 'Немає даних для створення'
            });

        }

        const columnIds =
        columns.map((column) => {
            return db.escapeId(column);
        }).join(', ');

        const placeholders =
        columns.map(() => {
            return '?';
        }).join(', ');

        const values =
        columns.map((column) => {
            return data[column];
        });

        db.query(
            `INSERT INTO ${db.escapeId(tableName)}
             (${columnIds})
             VALUES (${placeholders})`,
            values,
            (err, result) => {

                if (err) {
                    handleError(res, err);
                    return;
                }

                res.status(201).json({
                    message: 'Запис створено',
                    id: result.insertId
                });

            }
        );

    } catch (err) {

        handleError(res, err);

    }
};

exports.updateRow = async (req, res) => {

    try {

        const tableName =
        req.params.table;

        const rowId =
        req.params.id;

        const tableSchema =
        await ensureTable(tableName);

        if (!tableSchema.primaryKey) {

            return res.status(400).json({
                message: 'У таблиці немає primary key'
            });

        }

        let data =
        filterWritableData(tableSchema, req.body);

        delete data[tableSchema.primaryKey];

        data =
        await prepareAdminData(
            tableName,
            data,
            true
        );

        const emptyRequiredFields =
        getEmptyRequiredFieldsFromData(tableSchema, data);

        if (emptyRequiredFields.length > 0) {

            return res.status(400).json({
                message: `Не можна залишати порожніми поля: ${emptyRequiredFields.join(', ')}`
            });

        }

        const columns =
        Object.keys(data);

        if (columns.length === 0) {

            return res.status(400).json({
                message: 'Немає даних для оновлення'
            });

        }

        const setSql =
        columns.map((column) => {
            return `${db.escapeId(column)} = ?`;
        }).join(', ');

        const values =
        columns.map((column) => {
            return data[column];
        });

        values.push(rowId);

        db.query(
            `UPDATE ${db.escapeId(tableName)}
             SET ${setSql}
             WHERE ${db.escapeId(tableSchema.primaryKey)} = ?`,
            values,
            (err, result) => {

                if (err) {
                    handleError(res, err);
                    return;
                }

                if (result.affectedRows === 0) {

                    res.status(404).json({
                        message: 'Запис не знайдено'
                    });

                    return;
                }

                res.json({
                    message: 'Запис оновлено'
                });

            }
        );

    } catch (err) {

        handleError(res, err);

    }
};

exports.deleteRow = async (req, res) => {

    try {

        const tableName =
        req.params.table;

        const rowId =
        req.params.id;

        const tableSchema =
        await ensureTable(tableName);

        if (!tableSchema.primaryKey) {

            return res.status(400).json({
                message: 'У таблиці немає primary key'
            });

        }

        db.query(
            `DELETE FROM ${db.escapeId(tableName)}
             WHERE ${db.escapeId(tableSchema.primaryKey)} = ?`,
            [rowId],
            (err, result) => {

                if (err) {
                    handleError(res, err);
                    return;
                }

                if (result.affectedRows === 0) {

                    res.status(404).json({
                        message: 'Запис не знайдено'
                    });

                    return;
                }

                res.json({
                    message: 'Запис видалено'
                });

            }
        );

    } catch (err) {

        handleError(res, err);

    }
};
