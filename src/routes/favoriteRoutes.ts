import express from 'express';
import {
  addFavorite,
  removeFavorite,
  getUserFavorites,
} from '../controllers/favoriteController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/:propertyId', authMiddleware, addFavorite);
router.delete('/:propertyId', authMiddleware, removeFavorite);
router.get('/', authMiddleware, getUserFavorites);

export default router;