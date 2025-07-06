  import express from 'express';
  import cors from 'cors';
  import mongoose from 'mongoose';
  import dotenv from 'dotenv';
  import  propertyRoutes  from './routes/propertyRoutes';
  import authRoutes from './routes/authRoutes';
  import favoriteRoutes from './routes/favoriteRoutes';
  import recommendationRoutes from './routes/recommendationRoutes';
  import csvImportRoutes from './routes/csvImportRoutes';
  import { connectRedis } from './utils/redisClient';
  import { errorHandler, notFound } from './middlewares/errorMiddleware';

  dotenv.config();
  const app = express();
  const PORT = process.env.PORT || 5000;

  // Middlewares
  app.use(cors({
    origin: 'https://property-renting-new.vercel.app',
    credentials: true
  }));
  app.use(express.json());

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/properties', propertyRoutes);
  app.use('/api/favorites', favoriteRoutes);
  app.use('/api/recommendations', recommendationRoutes);
  app.use('/api/csv-import', csvImportRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
  });

  // Error handling
  app.use(notFound);
  app.use(errorHandler);

  // Connect to MongoDB and start server
  mongoose
    .connect(process.env.MONGO_URI as string)
    .then(async () => {
      console.log('Connected to MongoDB');
      await connectRedis();
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((err) => console.log('MongoDB connection error:', err));


      