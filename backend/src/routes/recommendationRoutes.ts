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


