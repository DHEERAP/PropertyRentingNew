import { Request, Response } from 'express';
import Favorite from '../models/Favorite';
import Property from '../models/Property';
import { redisClient } from '../utils/redisClient';

export const addFavorite = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = (req as any).userId;

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({ user: userId, property: propertyId });
    if (existingFavorite) {
      return res.status(400).json({ message: 'Property already in favorites' });
    }

    const favorite = new Favorite({
      user: userId,
      property: propertyId,
    });

    await favorite.save();

    // Clear favorites cache for this user
    await redisClient.del(`favorites:${userId}`);

    res.status(201).json(favorite);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const removeFavorite = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = (req as any).userId;

    const favorite = await Favorite.findOneAndDelete({
      user: userId,
      property: propertyId,
    });

    if (!favorite) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    // Clear favorites cache for this user
    await redisClient.del(`favorites:${userId}`);

    res.json({ message: 'Favorite removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserFavorites = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const cacheKey = `favorites:${userId}`;

    // Try to get cached data
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    const favorites = await Favorite.find({ user: userId })
      .populate({
        path: 'property',
        populate: {
          path: 'createdBy',
          select: 'name email',
        },
      });

    // Cache the result
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(favorites));

    res.json(favorites);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};








// https://www.loom.com/share/aa6751f479ca46afa0e1f1ecf9774f0e