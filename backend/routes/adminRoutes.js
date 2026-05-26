const express = require('express');

const router = express.Router();

const authMiddleware =
require('../middleware/authMiddleware');

const adminMiddleware =
require('../middleware/adminMiddleware');

const {
    getAdminInfo,
    getTables,
    getRows,
    createRow,
    updateRow,
    deleteRow
} = require('../controllers/adminController');

router.use(authMiddleware);

router.use(adminMiddleware);

router.get(
    '/me',
    getAdminInfo
);

router.get(
    '/tables',
    getTables
);

router.get(
    '/tables/:table/rows',
    getRows
);

router.post(
    '/tables/:table/rows',
    createRow
);

router.put(
    '/tables/:table/rows/:id',
    updateRow
);

router.delete(
    '/tables/:table/rows/:id',
    deleteRow
);

module.exports = router;
