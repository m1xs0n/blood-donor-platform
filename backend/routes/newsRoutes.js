const express = require('express');

const router = express.Router();

const authMiddleware =
require('../middleware/authMiddleware');

const adminMiddleware =
require('../middleware/adminMiddleware');

const {
    getPublishedNews,
    getPublishedNewsById,
    getAllNewsForAdmin,
    createNews,
    updateNews,
    deleteNews
} = require('../controllers/newsController');

router.get(
    '/admin/all',
    authMiddleware,
    adminMiddleware,
    getAllNewsForAdmin
);

router.post(
    '/admin',
    authMiddleware,
    adminMiddleware,
    createNews
);

router.put(
    '/admin/:id',
    authMiddleware,
    adminMiddleware,
    updateNews
);

router.delete(
    '/admin/:id',
    authMiddleware,
    adminMiddleware,
    deleteNews
);

router.get('/', getPublishedNews);

router.get('/:id', getPublishedNewsById);

module.exports = router;
