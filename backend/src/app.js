
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const campaignRoutes = require('./routes/campaignRoutes');
const authRoutes = require('./routes/authRoutes');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cors());

// Mount the modular routes
app.use('/api', campaignRoutes);
app.use('/auth', authRoutes);

// Health Check
app.get('/health', (req, res) => res.status(200).json({ status: 'OK', backend: 'Active' }));

module.exports = app;
