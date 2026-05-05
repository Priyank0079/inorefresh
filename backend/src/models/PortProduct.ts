import mongoose, { Document, Schema } from 'mongoose';

export interface IPortProduct extends Document {
  portId: mongoose.Types.ObjectId;
  productName: string;
  category: string;
  fishType?: string;
  sizeWeightClass?: string;
  qualityGrade: string;
  availableQuantity: number;
  pricePerKg: number;
  availabilityDate: Date;
  description?: string;
  image?: string;
  status: 'Active' | 'Inactive' | 'Sold Out';
  createdAt: Date;
  updatedAt: Date;
}

const PortProductSchema = new Schema<IPortProduct>(
  {
    portId: {
      type: Schema.Types.ObjectId,
      ref: 'PortUser',
      required: true,
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Premium', 'Fresh Catch', 'Frozen', 'Dried'],
      default: 'Fresh Catch',
    },
    fishType: {
      type: String,
      trim: true,
    },
    sizeWeightClass: {
      type: String,
      trim: true,
    },
    qualityGrade: {
      type: String,
      required: [true, 'Quality grade is required'],
      enum: ['Grade A+', 'Grade A', 'Grade B'],
      default: 'Grade A',
    },
    availableQuantity: {
      type: Number,
      required: [true, 'Available quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    pricePerKg: {
      type: Number,
      required: [true, 'Price per KG is required'],
      min: [0, 'Price cannot be negative'],
    },
    availabilityDate: {
      type: Date,
      required: [true, 'Availability date is required'],
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Sold Out'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

PortProductSchema.index({ portId: 1 });
PortProductSchema.index({ productName: 'text' });

const PortProduct = mongoose.models.PortProduct || mongoose.model<IPortProduct>('PortProduct', PortProductSchema);

export default PortProduct;
