import mongoose, { Document } from 'mongoose';

export interface IFavorite extends Document {
  user: mongoose.Types.ObjectId;
  property: mongoose.Types.ObjectId;
  createdAt: Date;
}

const favoriteSchema = new mongoose.Schema<IFavorite>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
}, { timestamps: true });

favoriteSchema.index({ user: 1, property: 1 }, { unique: true });

export default mongoose.model<IFavorite>('Favorite', favoriteSchema);