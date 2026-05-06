import 'dotenv/config';
import express from 'express';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { testDbConnection } from './config/db';

// Routes
import userRoutes from './routes/users.routes';
import exerciseRoutes from './routes/exercises.routes';
import syncRoutes from './routes/sync.routes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(requestLogger);

// Routes - Grouped under /api
app.use('/api/users', userRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/sync', syncRoutes);

// Error Handling
app.use(errorHandler);

// Start Server & Test Database
app.listen(PORT, async () => {
  console.log(`CoreSet API running on port ${PORT}`);
  
  // Verify Aiven connection on startup
  await testDbConnection();
});

export default app;