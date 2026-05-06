import mongoose, { Schema, Document } from 'mongoose';

export interface IPortOffer extends Document {
  requirementId: mongoose.Types.ObjectId;
  portId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  offeredPrice: number;
  counterPrice?: number;
  quantityOffered: number;
  status: 'pending' | 'countered' | 'negotiating' | 'approved' | 'rejected' | 'withdrawn' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Delayed' | 'Cancelled';
  deliveryDate: Date;
  notes?: string;
  negotiationHistory: Array<{
    price: number;
    offeredBy: 'port' | 'warehouse' | 'admin';
    timestamp: Date;
    notes?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const PortOfferSchema: Schema = new Schema(
  {
    requirementId: { type: Schema.Types.ObjectId, ref: 'PortRequirement', required: true },
    portId: { type: Schema.Types.ObjectId, ref: 'PortUser' },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    offeredPrice: { type: Number, required: true },
    counterPrice: { type: Number },
    quantityOffered: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'countered', 'negotiating', 'approved', 'rejected', 'withdrawn', 'In Transit', 'Out for Delivery', 'Delivered', 'Delayed', 'Cancelled'],
      default: 'pending',
    },
    deliveryDate: { type: Date, required: true },
    notes: { type: String },
    negotiationHistory: [
      {
        price: { type: Number, required: true },
        offeredBy: { type: String, enum: ['port', 'warehouse', 'admin'], required: true },
        timestamp: { type: Date, default: Date.now },
        notes: { type: String },
      },
    ],
    deliveryDetails: {
      vehicleType: { type: String, enum: ['Plane', 'Truck', 'Ship', 'Train', 'Bus', 'Other'] },
      estimatedArrival: { type: Date },
      additionalInfo: { type: String },
      trackingNumber: { type: String },
      status: { type: String, default: 'Preparing' },
      updatedAt: { type: Date, default: Date.now }
    },
  },
  { timestamps: true }
);

const PortOffer = mongoose.models.PortOffer || mongoose.model<IPortOffer>('PortOffer', PortOfferSchema);

export default PortOffer;
