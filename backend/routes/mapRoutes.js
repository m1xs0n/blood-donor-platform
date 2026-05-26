const express = require('express');

const router = express.Router();

const {
    getCenters,
    addCenter
} = require('../controllers/mapController');

router.get('/', getCenters);

router.post('/', addCenter);

module.exports = router;