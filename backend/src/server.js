const app = require('./app');
const config = require('./config/env');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const logger = require('./utils/logger');

let server;

async function startServer() {
  try {
    // 1. Connect to MongoDB
    await connectDatabase();

    // 2. Start HTTP Server
    server = app.listen(config.port, () => {
      logger.info(`PayLink Server running on port ${config.port} [${config.env}]`);
      logger.info(`API Base URL: ${config.publicBaseUrl}/api`);
      logger.info(`Gateway Integrations: Stripe [${config.stripe.isConfigured ? 'READY' : 'DEMO'}], Razorpay [${config.razorpay.isConfigured ? 'READY' : 'DEMO'}], Cashfree [${config.cashfree.isConfigured ? 'READY' : 'DEMO'}]`);
    });

    // Handle graceful shutdowns
    const shutdown = async (signal) => {
      logger.info(`${signal} received. Initiating graceful shutdown...`);
      if (server) {
        server.close(async () => {
          logger.info('HTTP server closed.');
          await disconnectDatabase();
          process.exit(0);
        });
      } else {
        await disconnectDatabase();
        process.exit(0);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Fatal startup error', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
