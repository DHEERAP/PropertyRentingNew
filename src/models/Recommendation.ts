import mongoose, { Document } from 'mongoose';

export interface IRecommendation extends Document {
  property: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  message?: string;
  createdAt: Date;
}

const recommendationSchema = new mongoose.Schema<IRecommendation>({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String },
}, { timestamps: true });

export default mongoose.model<IRecommendation>('Recommendation', recommendationSchema);