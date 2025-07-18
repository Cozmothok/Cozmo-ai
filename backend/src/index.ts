import dotenv from 'dotenv';
dotenv.config();

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import pool from './config/db';
import { User } from './models/User';
import authRoutes from './routes/auth';
import { protect } from './middleware/authMiddleware';

const app = express();
app.use(express.json()); // For parsing application/json
app.use(cors()); // Enable CORS for all routes

const PORT = process.env.PORT || 5000;

// Test DB connection and create table
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database', err.stack);
  } else {
    console.log('Database connected at:', res.rows[0].now);
    User.createTable(); // Create users table
  }
});

// Auth routes
app.use('/api/auth', authRoutes);

// Protected route example
app.get('/api/protected', protect, (req, res) => {
  res.json({ message: 'You have access to protected data!', userId: (req as any).userId });
});

app.get('/', (req, res) => {
  res.send('Cozmo AI Backend is running!');
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});