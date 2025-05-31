import express from 'express';
import {
  register,
  login,
  getCurrentUser,
  logout
} from '../controllers/authController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

// POST /api/auth/register - User registration
router.post('/register', register);

// POST /api/auth/login - User login
router.post('/login', login);

// GET /api/auth/me - Get current user (protected)
router.get('/me', authMiddleware, getCurrentUser);

// POST /api/auth/logout - User logout (protected)
router.post('/logout', authMiddleware, logout);

export default router;