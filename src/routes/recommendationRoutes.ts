import express from 'express';
import {
  recommendProperty,
  getReceivedRecommendations,
} from '../controllers/recommendationController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/:propertyId', authMiddleware, recommendProperty);
router.get('/', authMiddleware, getReceivedRecommendations);

export default router;





//////eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODM5MTJmNWYxZDAxNjFhNWE3MGZjOWMiLCJpYXQiOjE3NDg1NzA4NzAsImV4cCI6MTc0ODY1NzI3MH0.g7NOfuGlBMEuAEpskhGHX2J8yIYneecSE5sQdqKYzpI