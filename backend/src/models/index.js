const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Keep connection alive with periodic ping every 4 minutes
// Fly.io Postgres drops idle connections after ~5 minutes
setInterval(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    console.log('Keep-alive ping failed, reconnecting...');
    try { await prisma.$disconnect(); } catch (_) {}
    try {
      await prisma.$connect();
      console.log('Reconnected successfully');
    } catch (e) {
      console.error('Reconnect also failed:', e.message);
    }
  }
}, 4 * 60 * 1000);

// Handle connection drops gracefully with retry + exponential backoff
prisma.$use(async (params, next) => {
  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await next(params);
    } catch (error) {
      const isConnectionDead = error.code === 'P1017' ||
        error.code === 'P1001' ||
        error.message?.includes('closed the connection') ||
        error.message?.includes('Can\'t reach database');

      if (isConnectionDead && attempt < MAX_RETRIES) {
        const delay = Math.min(500 * Math.pow(2, attempt), 3000);
        console.log(`DB connection lost (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        try { await prisma.$disconnect(); } catch (_) {}
        try { await prisma.$connect(); } catch (_) {}
        continue;
      }
      throw error;
    }
  }
});

module.exports = prisma;
