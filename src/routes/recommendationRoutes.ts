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



// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODNhZWUyODc2OWM1OTk3MDdjNzg1ZDEiLCJpYXQiOjE3NDg2OTI1MjIsImV4cCI6MTc0ODc3ODkyMn0.rNmIQzgutN4FRwdmcGQsOgOIaYrF_0RP6SDJdxDUAJo

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODNhZWUyODc2OWM1OTk3MDdjNzg1ZDEiLCJpYXQiOjE3NDg2OTI1NzIsImV4cCI6MTc0ODc3ODk3Mn0.sc3pgKBluU2wJY9VLeTvLLg1NpGO5w3bvXHCFZSZ2T0