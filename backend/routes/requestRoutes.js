const express = require('express');

const router = express.Router();

const authMiddleware =
require('../middleware/authMiddleware');

const {
    createRequest,
    getRequests,
    respondToRequest
} = require('../controllers/requestController');

router.post(
    '/',
    authMiddleware,
    createRequest
);

router.get(
    '/',
    authMiddleware,
    getRequests
);

router.post(
    '/:id/respond',
    authMiddleware,
    respondToRequest
);

module.exports = router;