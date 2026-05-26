const db = require('../config/db');

const getSchema = () => {
    return new Promise((resolve, reject) => {

        db.query(
            `SELECT
                TABLE_NAME AS tableName,
                COLUMN_NAME AS columnName,
                DATA_TYPE AS dataType,
                COLUMN_KEY AS columnKey,
                EXTRA AS extra,
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

const filterWritableData = (tableSchema, data) => {

    const allowedColumns =
    tableSchema.columns
    .filter((column) => {
        return !column.extra.includes('auto_increment');
    })
    .map((column) => {
        return column.name;
    });

    const filtered = {};

    Object.keys(data || {}).forEach((key) => {

        if (allowedColumns.includes(key)) {

            filtered[key] =
            data[key] === ''
            ? null
            : data[key];

        }

    });

    return filtered;
};

const handleError = (res, err) => {

    console.log(err);

    res.status(err.status || 500).json({
        message: err.message || 'Помилка сервера'
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

        const data =
        filterWritableData(tableSchema, req.body);

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

        const data =
        filterWritableData(tableSchema, req.body);

        delete data[tableSchema.primaryKey];

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
