const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const mapRoutes = require('./src/routes/mapRoutes');
const poiRoutes = require('./src/routes/poiRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const passwordResetRoutes = require('./src/routes/passwordResetRoutes');
const invitationRoutes = require('./src/routes/invitationRoutes');

const app = express();

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Middlewares
app.use(cors({
  port: 3000,
  origin: process.env.NODE_ENV === 'test' ? '*' : 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}=> ${res.statusCode}`);
  next();
});

// Routes
const apiRouter = express.Router();
apiRouter.use('/auth', authRoutes);
apiRouter.use('/', userRoutes);
apiRouter.use('/maps', mapRoutes);
apiRouter.use('/pois', poiRoutes);
apiRouter.use('/', categoryRoutes);
apiRouter.use('/password-reset', passwordResetRoutes);
apiRouter.use('/', invitationRoutes);

app.use('/api/backend', apiRouter);

// Fallback for testing
app.get('/', (req, res) => {
  res.status(200).send('WayPoint API is running');
});

module.exports = app;
