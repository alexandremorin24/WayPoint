const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const mapRoutes = require('./src/routes/map.routes');
const poiRoutes = require('./src/routes/poiRoutes');

const app = express();

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Middlewares
app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/backend', authRoutes);
app.use('/api/backend', userRoutes);
app.use('/api/backend/maps', mapRoutes);
app.use('/api/backend/pois', poiRoutes);

// Fallback for testing
app.get('/', (req, res) => {
  res.status(200).send('WayPoint API is running');
});

module.exports = app;
