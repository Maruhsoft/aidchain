
console.log('[SERVER] Starting...');

const app = require('./app');

console.log('[SERVER] App loaded');

const PORT = process.env.PORT || 3001;

console.log('[SERVER] Attempting to listen on port', PORT);

try {
  const server = app.listen(PORT, '0.0.0.0', () => {
    const addr = server.address();
    console.log(`[SERVER] AidChain Backend running at ${addr.address}:${addr.port}`);
  });

  server.on('error', (err) => {
    console.error('[SERVER] Server error:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[SERVER] Unhandled Rejection:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('[SERVER] Uncaught Exception:', err);
    process.exit(1);
  });
} catch (err) {
  console.error('[SERVER] Failed to start server:', err);
  process.exit(1);
}
