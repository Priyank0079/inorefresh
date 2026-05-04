import mongoose, { Schema, Document } from 'mongoose';

export interface IPortRequirement extends Document {
  requirementId: string;
  fishName: string;
  category: string;
  grade: string;
  quantityRequired: number;
  unit: string;
  deadline: Date;
  status: 'Open' | 'Pending' | 'Negotiating' | 'Expired' | 'Completed' | 'Cancelled';
  warehouseId: mongoose.Types.ObjectId;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PortRequirementSchema: Schema = new Schema(
  {
    requirementId: { type: String, required: true, unique: true },
    fishName: { type: String, required: true },
    category: { type: String, required: true },
    grade: { type: String, required: true },
    quantityRequired: { type: Number, required: true },
    unit: { type: String, default: 'kg' },
    deadline: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Open', 'Pending', 'Negotiating', 'Expired', 'Completed', 'Cancelled'],
      default: 'Open',
    },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

// Force clear model from cache to apply schema changes in development
if (mongoose.models.PortRequirement) {
  delete mongoose.models.PortRequirement;
}

const PortRequirement = mongoose.model<IPortRequirement>('PortRequirement', PortRequirementSchema);

export default PortRequirement;
