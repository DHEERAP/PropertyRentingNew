import { Request, Response } from 'express';
import Recommendation from '../models/Recommendation';
import Property from '../models/Property';
import User from '../models/User';
import { redisClient } from '../utils/redisClient';

export const recommendProperty = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const { recipientEmail, message } = req.body;
    const senderId = (req as any).userId;

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if recipient exists
    const recipient = await User.findOne({ email: recipientEmail });
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Don't allow recommending to yourself
    if (recipient._id.toString() === senderId.toString()) {
      return res.status(400).json({ message: 'Cannot recommend to yourself' });
    }

    // Create recommendation
    const recommendation = new Recommendation({
      property: propertyId,
      sender: senderId,
      recipient: recipient._id,
      message,
    });

    await recommendation.save();

    // Clear recommendations cache for recipient
    await redisClient.del(`recommendations:${recipient._id}`);

    res.status(201).json(recommendation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getReceivedRecommendations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const cacheKey = `recommendations:${userId}`;

    // Try to get cached data
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    const recommendations = await Recommendation.find({ recipient: userId })
      .populate({
        path: 'property',
        populate: {
          path: 'createdBy',
          select: 'name email',
        },
      })
      .populate('sender', 'name email');

    // Cache the result
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(recommendations));

    res.json(recommendations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};