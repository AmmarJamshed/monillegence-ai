import { bootstrapServer } from './server/createServer.js';

bootstrapServer().catch((err) => {
  console.error('Failed to start Monillegence Agent Backend:', err);
  process.exit(1);
});
