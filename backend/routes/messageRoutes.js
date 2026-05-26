const express = require('express');

const router = express.Router();

const authMiddleware =
require('../middleware/authMiddleware');

const {
    getConversations,
    getMessages,
    sendMessage,
    confirmDonation
} = require('../controllers/messageController');

router.use(authMiddleware);

router.get(
    '/conversations',
    getConversations
);

router.get(
    '/:requestId/:otherUserId',
    getMessages
);

router.post(
    '/',
    sendMessage
);

router.post(
    '/confirm-donation',
    confirmDonation
);

module.exports = router;
