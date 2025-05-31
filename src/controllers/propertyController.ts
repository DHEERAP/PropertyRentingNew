import { Request, Response } from 'express';
import Property from '../models/Property';
import { redisClient } from '../utils/redisClient';
import csvtojson from 'csvtojson';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const CACHE_EXPIRATION = 3600; // 1 hour in seconds

// CSV Import Function
export const importProperties = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check file type
    if (!req.file.mimetype.includes('csv') && !req.file.originalname.endsWith('.csv')) {
      return res.status(400).json({ 
        message: 'Invalid file type. Please upload a CSV file.',
        receivedType: req.file.mimetype
      });
    }

    const userId = (req as any).userId;
    const csvData = req.file.buffer.toString('utf-8').replace(/^\uFEFF/, ''); // Remove BOM if present

    const jsonArray = await csvtojson({
      checkType: true,
      trim: true,
      colParser: {
        'price': 'number',
        'areaSqFt': 'number',
        'bedrooms': 'number',
        'bathrooms': 'number',
        'rating': 'number',
        'isVerified': (item) => item.toLowerCase() === 'true',
        'amenities': (item) => item.replace(/^"|"$/g, '').split('|'),
        'tags': (item) => item.replace(/^"|"$/g, '').split('|'),
        'availableFrom': (item) => new Date(item)
      }
    }).fromString(csvData);

    // Validate required fields
    const requiredFields = ['id', 'title', 'type', 'price', 'state', 'city'];
    const invalidRows = jsonArray.filter((row: any) => 
      requiredFields.some(field => !row[field])
    );

    if (invalidRows.length > 0) {
      return res.status(400).json({
        message: 'Invalid data in CSV',
        invalidRows: invalidRows.map((row: any) => row.id)
      });
    }

    const properties = jsonArray.map((item: any) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      price: item.price,
      state: item.state,
      city: item.city,
      areaSqFt: item.areaSqFt,
      bedrooms: item.bedrooms,
      bathrooms: item.bathrooms,
      amenities: item.amenities,
      furnished: item.furnished,
      availableFrom: item.availableFrom,
      listedBy: item.listedBy,
      tags: item.tags,
      colorTheme: item.colorTheme,
      rating: item.rating,
      isVerified: item.isVerified,
      listingType: item.listingType,
      createdBy: userId
    }));

    const result = await Property.bulkWrite(
      properties.map(property => ({
        updateOne: {
          filter: { id: property.id },
          update: { $setOnInsert: property },
          upsert: true
        }
      }))
    );

    await redisClient.del('properties:all');

    res.status(201).json({
      message: 'Properties imported successfully',
      insertedCount: result.upsertedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (error: unknown) {
    console.error('CSV import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      message: 'Failed to import properties', 
      error: errorMessage 
    });
  }
};

// Create Property
export const createProperty = async (req: Request, res: Response) => {
  try {
    const { 
      id, title, type, price, state, city, areaSqFt, bedrooms, bathrooms,
      amenities, furnished, availableFrom, listedBy, tags, colorTheme,
      rating, isVerified, listingType 
    } = req.body;
    const userId = (req as any).userId;

    const property = new Property({
      id,
      title,
      type,
      price,
      state,
      city,
      areaSqFt,
      bedrooms,
      bathrooms,
      amenities,
      furnished,
      availableFrom,
      listedBy,
      tags,
      colorTheme,
      rating,
      isVerified,
      listingType,
      createdBy: userId,
    });

    await property.save();

    await redisClient.del('properties:all');
    res.status(201).json(property);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get All Properties
export const getProperties = async (req: Request, res: Response) => {
  try {
    const { 
      location, minPrice, maxPrice, bedrooms, bathrooms, 
      minArea, maxArea, type, status, amenities,
      search, sortBy, sortOrder = 'asc', page = 1, limit = 10
    } = req.query;

    const cacheKey = `properties:${JSON.stringify(req.query)}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) return res.json(JSON.parse(cachedData));

    const query: any = {};
    if (location) query.location = { $regex: location, $options: 'i' };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (bedrooms) query.bedrooms = Number(bedrooms);
    if (bathrooms) query.bathrooms = Number(bathrooms);
    if (minArea || maxArea) {
      query.areaSqFt = {};
      if (minArea) query.areaSqFt.$gte = Number(minArea);
      if (maxArea) query.areaSqFt.$lte = Number(maxArea);
    }
    if (type) query.type = type;
    if (status) query.status = status;
    if (amenities) {
      query.amenities = { $all: (amenities as string).split(',') };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const [properties, total] = await Promise.all([
      Property.find(query)
        .sort(sortBy ? { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 } : {})
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .populate('createdBy', 'name email'),
      Property.countDocuments(query),
    ]);

    const result = {
      properties,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    };

    await redisClient.setEx(cacheKey, CACHE_EXPIRATION, JSON.stringify(result));
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Property by ID
export const getPropertyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cacheKey = `property:${id}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) return res.json(JSON.parse(cachedData));

    const property = await Property.findById(id).populate('createdBy', 'name email');
    if (!property) return res.status(404).json({ message: 'Property not found' });

    await redisClient.setEx(cacheKey, CACHE_EXPIRATION, JSON.stringify(property));
    res.json(property);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Property
export const updateProperty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    // const property = await Property.findById(id);
    const property = await Property.findOne({ id }).populate('createdBy', 'name email');
    if (!property) return res.status(404).json({ message: 'Property not found' });
    if (property.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this property' });
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );

    await Promise.all([
      redisClient.del(`property:${id}`),
      redisClient.del('properties:all'),
    ]);
    res.json(updatedProperty);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete Property
export const deleteProperty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const property = await Property.findById(id);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    if (property.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this property' });
    }

    await Property.findByIdAndDelete(id);
    await Promise.all([
      redisClient.del(`property:${id}`),
      redisClient.del('properties:all'),
    ]);
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Import Template
export const getImportTemplate = async (req: Request, res: Response) => {
  try {
    const template = {
      id: 'PROP1000',
      title: 'Sample Property',
      type: 'Apartment|Villa|Bungalow',
      price: 1000000,
      state: 'State Name',
      city: 'City Name',
      areaSqFt: 1500,
      bedrooms: 2,
      bathrooms: 2,
      amenities: 'lift|parking|pool (pipe separated)',
      furnished: 'Furnished|Unfurnished|Semi',
      availableFrom: 'YYYY-MM-DD',
      listedBy: 'Builder|Owner|Agent',
      tags: 'gated-community|near-metro (pipe separated)',
      colorTheme: '#hexcolor',
      rating: 4.5,
      isVerified: true,
      listingType: 'rent|sale'
    };

    res.json(template);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Direct File Import Function
export const importPropertiesFromFile = async (filePath: string, userId: string) => {
  try {
    const csvData = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, ''); // Remove BOM if present

    const jsonArray = await csvtojson({
      checkType: true,
      trim: true,
      colParser: {
        'price': 'number',
        'areaSqFt': 'number',
        'bedrooms': 'number',
        'bathrooms': 'number',
        'rating': 'number',
        'isVerified': (item) => item.toLowerCase() === 'true',
        'amenities': (item) => item.replace(/^"|"$/g, '').split('|'),
        'tags': (item) => item.replace(/^"|"$/g, '').split('|'),
        'availableFrom': (item) => new Date(item)
      }
    }).fromString(csvData);

    // Validate required fields
    const requiredFields = ['id', 'title', 'type', 'price', 'state', 'city'];
    const invalidRows = jsonArray.filter((row: any) => 
      requiredFields.some(field => !row[field])
    );

    if (invalidRows.length > 0) {
      throw new Error(`Invalid data in CSV for rows: ${invalidRows.map((row: any) => row.id).join(', ')}`);
    }

    const properties = jsonArray.map((item: any) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      price: item.price,
      state: item.state,
      city: item.city,
      areaSqFt: item.areaSqFt,
      bedrooms: item.bedrooms,
      bathrooms: item.bathrooms,
      amenities: item.amenities,
      furnished: item.furnished,
      availableFrom: item.availableFrom,
      listedBy: item.listedBy,
      tags: item.tags,
      colorTheme: item.colorTheme,
      rating: item.rating,
      isVerified: item.isVerified,
      listingType: item.listingType,
      createdBy: userId
    }));

    const result = await Property.bulkWrite(
      properties.map(property => ({
        updateOne: {
          filter: { id: property.id },
          update: { $setOnInsert: property },
          upsert: true
        }
      }))
    );

    await redisClient.del('properties:all');

    return {
      message: 'Properties imported successfully',
      insertedCount: result.upsertedCount,
      modifiedCount: result.modifiedCount
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to import properties: ${errorMessage}`);
  }
};

// Add a new route for direct file import
export const importPropertiesDirect = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const filePath = path.join(__dirname, '../../property_listing.csv');
    
    const result = await importPropertiesFromFile(filePath, userId);
    res.status(201).json(result);
  } catch (error: unknown) {
    console.error('Direct import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      message: 'Failed to import properties', 
      error: errorMessage 
    });
  }
};

