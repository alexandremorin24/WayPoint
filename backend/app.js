const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const mapRoutes = require('./src/routes/map.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/backend', authRoutes);
app.use('/api/backend', userRoutes);
app.use('/api/backend/maps', mapRoutes);

// Fallback pour tester
app.get('/', (req, res) => {
  res.status(200).send('WayPoint API is running');
});

module.exports = app;
