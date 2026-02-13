const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const sessionConfig = require('./config/session');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.set('trust proxy', 1);
}

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session(sessionConfig));

// Static files
app.use('/static', express.static(path.join(__dirname, '..', 'static')));

// API routes
app.use('/api', routes);

// Production: serve React SPA
if (isProduction) {
  const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDistPath));
  app.get('{*path}', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
