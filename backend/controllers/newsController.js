const db = require('../config/db');

const publicFields = `
    id,
    title,
    summary,
    content,
    image_url,
    external_url,
    status,
    created_at,
    updated_at
`;

const normalizeNewsPayload = (body) => {
    return {
        title: body.title ? body.title.trim() : '',
        summary: body.summary ? body.summary.trim() : null,
        content: body.content ? body.content.trim() : '',
        image_url: body.image_url ? body.image_url.trim() : null,
        external_url: body.external_url ? body.external_url.trim() : null,
        status: body.status === 'draft' ? 'draft' : 'published'
    };
};

const validateNewsPayload = (data) => {
    if (!data.title || !data.content) {
        return 'Title and content are required';
    }

    if (data.title.length > 255) {
        return 'Title is too long';
    }

    if (data.summary && data.summary.length > 500) {
        return 'Summary is too long';
    }

    return null;
};

const handleError = (res, err) => {
    console.log(err);

    res.status(500).json({
        message: 'Server error'
    });
};

exports.getPublishedNews = (req, res) => {
    db.query(
        `SELECT ${publicFields}
         FROM news
         WHERE status = 'published'
         ORDER BY created_at DESC`,
        (err, rows) => {
            if (err) {
                handleError(res, err);
                return;
            }

            res.json(rows);
        }
    );
};

exports.getPublishedNewsById = (req, res) => {
    db.query(
        `SELECT ${publicFields}
         FROM news
         WHERE id = ?
         AND status = 'published'
         LIMIT 1`,
        [req.params.id],
        (err, rows) => {
            if (err) {
                handleError(res, err);
                return;
            }

            if (rows.length === 0) {
                return res.status(404).json({
                    message: 'News not found'
                });
            }

            res.json(rows[0]);
        }
    );
};

exports.getAllNewsForAdmin = (req, res) => {
    db.query(
        `SELECT ${publicFields}, created_by
         FROM news
         ORDER BY created_at DESC`,
        (err, rows) => {
            if (err) {
                handleError(res, err);
                return;
            }

            res.json(rows);
        }
    );
};

exports.createNews = (req, res) => {
    const data = normalizeNewsPayload(req.body);

    const validationError = validateNewsPayload(data);

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }

    db.query(
        `INSERT INTO news
        (
            title,
            summary,
            content,
            image_url,
            external_url,
            status,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            data.title,
            data.summary,
            data.content,
            data.image_url,
            data.external_url,
            data.status,
            req.user.id
        ],
        (err, result) => {
            if (err) {
                handleError(res, err);
                return;
            }

            res.status(201).json({
                message: 'News created',
                id: result.insertId
            });
        }
    );
};

exports.updateNews = (req, res) => {
    const data = normalizeNewsPayload(req.body);

    const validationError = validateNewsPayload(data);

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }

    db.query(
        `UPDATE news
         SET title = ?,
             summary = ?,
             content = ?,
             image_url = ?,
             external_url = ?,
             status = ?
         WHERE id = ?`,
        [
            data.title,
            data.summary,
            data.content,
            data.image_url,
            data.external_url,
            data.status,
            req.params.id
        ],
        (err, result) => {
            if (err) {
                handleError(res, err);
                return;
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: 'News not found'
                });
            }

            res.json({
                message: 'News updated'
            });
        }
    );
};

exports.deleteNews = (req, res) => {
    db.query(
        `DELETE FROM news
         WHERE id = ?`,
        [req.params.id],
        (err, result) => {
            if (err) {
                handleError(res, err);
                return;
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: 'News not found'
                });
            }

            res.json({
                message: 'News deleted'
            });
        }
    );
};
