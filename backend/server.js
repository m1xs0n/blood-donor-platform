const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config({
    path: path.join(__dirname, '.env')
});

const app = express();

app.use(cors());
app.use(express.json());

require('./config/db');

const authRoutes = require('./routes/authRoutes');

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('Сервер працює!');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT}`);
});

const donorRoutes =
require('./routes/donorRoutes');
app.use('/api/donor', donorRoutes);

const requestRoutes =
require('./routes/requestRoutes');
app.use('/api/requests', requestRoutes);

const mapRoutes =
require('./routes/mapRoutes');
app.use('/api/map', mapRoutes);

const bookingRoutes =
require('./routes/bookingRoutes');
app.use('/api/bookings', bookingRoutes);

const adminRoutes =
require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

const messageRoutes =
require('./routes/messageRoutes');
app.use('/api/messages', messageRoutes);

const newsRoutes =
require('./routes/newsRoutes');
app.use('/api/news', newsRoutes);
