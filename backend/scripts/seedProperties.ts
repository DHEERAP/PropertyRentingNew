import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Property from '../src/models/Property'; // adjust path as needed

dotenv.config();
  
const MONGO_URI = process.env.MONGO_URI as string;

async function importCSV() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const results: any[] = [];

    fs.createReadStream(path.join(__dirname, '../data/property.csv'))
      .pipe(csvParser())
      .on('data', (row) => {
        results.push({
          name: row.name,
          location: row.location,
          price: parseFloat(row.price),
          type: row.type,
          area: parseFloat(row.area),
          bedrooms: parseInt(row.bedrooms),
          bathrooms: parseInt(row.bathrooms),
          amenities: row.amenities?.split(','),
          description: row.description,
          // createdBy: 'admin', // optional if you're assigning user manually
        });
      })
      .on('end', async () => {
        try {
          await Property.insertMany(results);
          console.log(`✅ Successfully inserted ${results.length} properties`);
        } catch (err) {
          console.error('❌ Failed to insert data:', err);
        } finally {
          await mongoose.disconnect();
          console.log('🔌 MongoDB disconnected');
        }
      });
  } catch (err) {
    console.error('❌ Error connecting to MongoDB:', err);
  }
} 