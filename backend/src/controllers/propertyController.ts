import { Request, Response } from 'express';
import Property, { IProperty } from '../models/Property';
import { redisClient, deleteKeysByPattern } from '../utils/redisClient';
import csvtojson from 'csvtojson';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { evaluatePropertyWithGemini } from '../utils/geminiAI';

const CACHE_EXPIRATION = 3600; // 1 hour in seconds

// Add this at the top of the file (after imports)
function safeString(val: unknown): string {
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  return '';
}

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

    await deleteKeysByPattern('properties:*');

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

    await deleteKeysByPattern('properties:*');
    await deleteKeysByPattern('property:*');
    res.status(201).json(property);
  } catch (error: any) {
    console.error(error);
    if (error.code === 11000 && error.keyPattern && error.keyPattern.id) {
      return res.status(400).json({ message: `A property with ID '${error.keyValue.id}' already exists. Please use a unique Property ID.` });
    }
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

    // Create a more efficient cache key by sorting query parameters
    const sortedQuery = Object.keys(req.query)
      .sort()
      .reduce((result: Record<string, any>, key) => {
        result[key] = req.query[key];
        return result;
      }, {});
    
    const cacheKey = `properties:${JSON.stringify(sortedQuery)}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) return res.json(JSON.parse(cachedData));

    const query: Record<string, any> = {};
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
      // Convert search to string and handle type safety
      const searchString = Array.isArray(search) ? search[0] : search as string;
      if (searchString && typeof searchString === 'string') {
        const searchTerms = searchString.trim().split(/\s+/).filter((term: string) => term.length > 0);
        // All terms must be present in at least one of the fields
        query.$and = searchTerms.map((term: string) => ({
          $or: [
            { title: { $regex: term, $options: 'i' } },
            { state: { $regex: term, $options: 'i' } },
            { city: { $regex: term, $options: 'i' } },
          ]
        }));
      }
    }
    if (req.query.createdBy) {
      try {
        const objId = new mongoose.Types.ObjectId(req.query.createdBy as string);
        query.$or = [
          { createdBy: objId },
          { createdBy: req.query.createdBy }
        ];
      } catch {
        query.createdBy = req.query.createdBy;
      }
    }

    const [properties, total] = await Promise.all([
      Property.find(query)
        .select('id title type price state city areaSqFt bedrooms bathrooms amenities furnished availableFrom listedBy tags colorTheme rating isVerified listingType imageUrl createdAt')
        .sort(sortBy ? { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 } : {})
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .populate('createdBy', 'name email')
        .lean(), // Use lean() for better performance when you don't need Mongoose document methods
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

    const property = await Property.findById(id)
      .populate('createdBy', 'name email')
      .lean();
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
    const { id } = req.params; // property._id
    const userId = (req as any).userId;

    // Find property by _id
    const property = await Property.findById(id);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    if (property.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this property' });
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );

    await deleteKeysByPattern('properties:*');
    await deleteKeysByPattern('property:*');
    res.json(updatedProperty);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete Property
export const deleteProperty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // property._id
    const userId = (req as any).userId;

    // Find property by _id
    const property = await Property.findById(id);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    if (property.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this property' });
    }

    await Property.findByIdAndDelete(id);
    await deleteKeysByPattern('properties:*');
    await deleteKeysByPattern('property:*');
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

    await deleteKeysByPattern('properties:*');

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

export const getMyProperties = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ message: 'Not authorized' });
    const properties = await Property.find({ createdBy: userId }).populate('createdBy', 'name email');
    res.json({ properties });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const aiPropertyEvaluation = async (req: any, res: any) => {
  try {
    const { price, areaSqFt, city, state, type, bedrooms, bathrooms, amenities, description } = req.body;
    const cityStr = safeString(city);
    // Get market data for comparison
    const marketData = await Property.aggregate([
      {
        $match: {
          $and: [
            { city: { $regex: new RegExp(cityStr, 'i') } },
            { type: type },
            { price: { $exists: true, $ne: null } },
            { areaSqFt: { $exists: true, $ne: null } }
          ]
        }
      },
      {
        $group: {
          _id: null,
          avgPrice: { $avg: "$price" },
          avgPricePerSqFt: { $avg: { $divide: ["$price", "$areaSqFt"] } },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
          count: { $sum: 1 },
          avgBedrooms: { $avg: "$bedrooms" },
          avgBathrooms: { $avg: "$bathrooms" },
          avgArea: { $avg: "$areaSqFt" }
        }
      }
    ]);

    // Get amenities analysis
    const amenitiesAnalysis = await Property.aggregate([
      {
        $match: {
          $and: [
            { city: { $regex: new RegExp(cityStr, 'i') } },
            { type: type },
            { amenities: { $exists: true, $ne: [] } }
          ]
        }
      },
      {
        $unwind: "$amenities"
      },
      {
        $group: {
          _id: "$amenities",
          count: { $sum: 1 },
          avgPrice: { $avg: "$price" }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get recent market trends
    const recentProperties = await Property.find({
      city: { $regex: new RegExp(cityStr, 'i') },
      type: type,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('price areaSqFt bedrooms bathrooms amenities rating isVerified listingType');

    const marketInfo = marketData[0] || {};
    const pricePerSqFt = areaSqFt ? price / areaSqFt : 0;
    const marketPricePerSqFt = marketInfo.avgPricePerSqFt || 0;
    // const priceComparison = marketPricePerSqFt > 0 ? ((pricePerSqFt - marketPricePerSqFt) / marketPricePerSqFt * 100).toFixed(1) : 0;
   // Build comprehensive prompt for Gemini
    // const prompt = `You are a real estate market analyst with access to comprehensive property data. Analyze the following property for investment potential and provide detailed market insights.\n\nPROPERTY DETAILS:\n- Price: ₹${price?.toLocaleString()}\n- Area: ${areaSqFt} sq.ft.\n- Price per sq.ft: ₹${pricePerSqFt?.toFixed(2)}\n- Location: ${cityStr}, ${state}\n- Type: ${type}\n- Bedrooms: ${bedrooms}\n- Bathrooms: ${bathrooms}\n- Amenities: ${Array.isArray(amenities) ? amenities.join(", ") : amenities}\n- Description: ${description || "N/A"}\n\nMARKET ANALYSIS DATA:\n- Average price in ${cityStr} for ${type}: ₹${marketInfo.avgPrice?.toLocaleString() || 'N/A'}\n- Average price per sq.ft in ${cityStr} for ${type}: ₹${marketInfo.avgPricePerSqFt?.toFixed(2) || 'N/A'}\n- Price comparison: ${priceComparison}% ${parseFloat() > 0 ? 'above' : 'below'} market average\n- Market range: ₹${marketInfo.minPrice?.toLocaleString() || 'N/A'} - ₹${marketInfo.maxPrice?.toLocaleString() || 'N/A'}\n- Total similar properties in market: ${marketInfo.count || 0}\n- Average bedrooms in market: ${marketInfo.avgBedrooms?.toFixed(1) || 'N/A'}\n- Average bathrooms in market: ${marketInfo.avgBathrooms?.toFixed(1) || 'N/A'}\n\nTOP AMENITIES IN ${cityStr} ${type} MARKET:\n${amenitiesAnalysis.map((item, index) => `${index + 1}. ${item._id}: ${item.count} properties (avg price: ₹${item.avgPrice?.toLocaleString()})`).join('\\n')}\n\nRECENT MARKET ACTIVITY (Last 30 days):\n${recentProperties.map((prop, index) => `${index + 1}. ₹${prop.price?.toLocaleString()} | ${prop.areaSqFt} sq.ft | ${prop.bedrooms}B/${prop.bathrooms}B | Rating: ${prop.rating} | ${prop.isVerified ? 'Verified' : 'Unverified'}`).join('\\n')}\n\nANALYSIS REQUIREMENTS:\n1. **Price Analysis**: Compare the property price with market averages and recent sales\n2. **Amenities Value**: Evaluate the property's amenities against market preferences\n3. **Location Assessment**: Consider the location's desirability and growth potential\n4. **Investment Potential**: Assess rental yield potential and appreciation prospects\n5. **Risk Factors**: Identify any potential risks or concerns\n6. **Recommendation**: Provide a clear BUY/HOLD/AVOID recommendation with reasoning\n7. **Market Trends**: Comment on current market conditions in ${cityStr}\n8. **Amenities Impact**: How do the property's amenities compare to market standards?\n\nProvide a comprehensive analysis in a structured format with clear sections for each aspect. Be specific about numbers and market data.`;




const priceComparison =
  marketPricePerSqFt > 0
    ? ((pricePerSqFt - marketPricePerSqFt) / marketPricePerSqFt * 100).toFixed(1)
    : '0';

const priceComparisonText = parseFloat(priceComparison) > 0 ? 'above' : 'below';

const prompt = `You are a real estate market analyst with access to comprehensive property data. Analyze the following property for investment potential and provide detailed market insights.

PROPERTY DETAILS:
- Price: ₹${price?.toLocaleString()}
- Area: ${areaSqFt} sq.ft.
- Price per sq.ft: ₹${pricePerSqFt?.toFixed(2)}
- Location: ${cityStr}, ${state}
- Type: ${type}
- Bedrooms: ${bedrooms}
- Bathrooms: ${bathrooms}
- Amenities: ${Array.isArray(amenities) ? amenities.join(", ") : amenities}
- Description: ${description || "N/A"}

MARKET ANALYSIS DATA:
- Average price in ${cityStr} for ${type}: ₹${marketInfo.avgPrice?.toLocaleString() || 'N/A'}
- Average price per sq.ft in ${cityStr} for ${type}: ₹${marketInfo.avgPricePerSqFt?.toFixed(2) || 'N/A'}
- Price comparison: ${priceComparison}% ${priceComparisonText} market average
- Market range: ₹${marketInfo.minPrice?.toLocaleString() || 'N/A'} - ₹${marketInfo.maxPrice?.toLocaleString() || 'N/A'}
- Total similar properties in market: ${marketInfo.count || 0}
- Average bedrooms in market: ${marketInfo.avgBedrooms?.toFixed(1) || 'N/A'}
- Average bathrooms in market: ${marketInfo.avgBathrooms?.toFixed(1) || 'N/A'}

TOP AMENITIES IN ${cityStr} ${type} MARKET:
${amenitiesAnalysis.map((item, index) => `${index + 1}. ${item._id}: ${item.count} properties (avg price: ₹${item.avgPrice?.toLocaleString()})`).join('\n')}

RECENT MARKET ACTIVITY (Last 30 days):
${recentProperties.map((prop, index) => `${index + 1}. ₹${prop.price?.toLocaleString()} | ${prop.areaSqFt} sq.ft | ${prop.bedrooms}B/${prop.bathrooms}B | Rating: ${prop.rating} | ${prop.isVerified ? 'Verified' : 'Unverified'}`).join('\n')}

ANALYSIS REQUIREMENTS:
1. **Price Analysis**: Compare the property price with market averages and recent sales
2. **Amenities Value**: Evaluate the property's amenities against market preferences
3. **Location Assessment**: Consider the location's desirability and growth potential
4. **Investment Potential**: Assess rental yield potential and appreciation prospects
5. **Risk Factors**: Identify any potential risks or concerns
6. **Recommendation**: Provide a clear BUY/HOLD/AVOID recommendation with reasoning
7. **Market Trends**: Comment on current market conditions in ${cityStr}
8. **Amenities Impact**: How do the property's amenities compare to market standards?

Provide a comprehensive analysis in a structured format with clear sections for each aspect. Be specific about numbers and market data.`;
    const aiResponse = await evaluatePropertyWithGemini(prompt);
    res.status(200).json({ success: true, result: aiResponse });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, message: 'AI evaluation failed', error: errMsg });
  }
};

