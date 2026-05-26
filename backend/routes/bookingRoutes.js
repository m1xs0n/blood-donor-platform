const express = require('express');

const router = express.Router();

const authMiddleware =
require('../middleware/authMiddleware');

const {
    createBooking,
    getBookings,
    updateBooking,
    getCenters
} = require(
    '../controllers/bookingController'
);

router.post(
    '/',
    authMiddleware,
    createBooking
);

router.get(
    '/',
    authMiddleware,
    getBookings
);

router.put(
    '/:id',
    authMiddleware,
    updateBooking
);

router.get(
    '/centers',
    authMiddleware,
    getCenters
);

module.exports = router;
