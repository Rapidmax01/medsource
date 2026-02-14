const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const prisma = require('./models');

// Route imports
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const inquiryRoutes = require('./routes/inquiries');
const sellerRoutes = require('./routes/sellers');
const paymentRoutes = require('./routes/payments');
const notificationRoutes = require('./routes/notifications');
const nafdacRoutes = require('./routes/nafdac');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');

const app = express();

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(helmet());
app.use(cors({
  origin: [config.frontendUrl, 'https://medsourceng.com', 'https://www.medsourceng.com', 'https://medsource-ng.fly.dev', 'http://localhost:5173'],
  credentials: true,
}));
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));

// Raw body for webhook signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// JSON parser for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================================
// ROUTES
// ============================================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'MedSource API', version: '1.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/nafdac', nafdacRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

// ============================================================
// ERROR HANDLING
// ============================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'A record with this value already exists' });
  }

  res.status(err.status || 500).json({
    error: config.env === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

// ============================================================
// START SERVER
// ============================================================

const PORT = config.port;

if (config.env !== 'test') {
  app.listen(PORT, () => {
    console.log(`\n🏥 MedSource API running on port ${PORT}`);
    console.log(`📍 Environment: ${config.env}`);
    console.log(`🔗 ${config.env === 'production' ? config.frontendUrl : `http://localhost:${PORT}`}\n`);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = app;
