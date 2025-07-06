import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { redisClient } from '../utils/redisClient';

const JWT_SECRET = process.env.JWT_SECRET as string;

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // Try to get user from cache
    const cachedUser = await redisClient.get(`user:${decoded.userId}`);
    if (cachedUser) {
      (req as any).userId = decoded.userId;
      return next();
    }

    // If not in cache, check database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    (req as any).userId = decoded.userId;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};


// import { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';
// import { redisClient } from '../utils/redisClient';

// const JWT_SECRET = process.env.JWT_SECRET as string;

// export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const token = req.header('Authorization')?.replace('Bearer ', '');

//     if (!token) {
//       return res.status(401).json({ message: 'No token, authorization denied' });
//     }

//     const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

//     // Check cache first
//     const cachedUser = await redisClient.get(`user:${decoded.userId}`);
//     if (cachedUser) {
//       (req as any).userId = decoded.userId;
//       return next();
//     }

//     // If not in cache, check database
//     const user = await User.findById(decoded.userId);
//     if (!user) {
//       return res.status(401).json({ message: 'Token is not valid' });
//     }

//     (req as any).userId = decoded.userId;
//     next();
//   } catch (error) {
//     console.error(error);
//     res.status(401).json({ message: 'Token is not valid' });
//   }
// };