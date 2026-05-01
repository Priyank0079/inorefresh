import mongoose, { Document, Schema } from "mongoose";

export interface IInwardStock extends Document {
  warehouse: mongoose.Types.ObjectId;
  supplierName: string;
  sourcePort?: string;
  productName: string;
  variant: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  date: Date;
  orderDate?: Date;
  deliveryDate?: Date;
  invoiceNumber?: string;
  batchNumber?: string;
  vehicleNumber?: string;
  status: "Pending" | "Received" | "Cancelled";
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InwardStockSchema = new Schema<IInwardStock>(
  {
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    supplierName: {
      type: String,
      required: true,
      trim: true,
    },
    sourcePort: {
      type: String,
      trim: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    variant: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    orderDate: {
      type: Date,
    },
    deliveryDate: {
      type: Date,
    },
    invoiceNumber: {
      type: String,
      trim: true,
    },
    batchNumber: {
      type: String,
      trim: true,
    },
    vehicleNumber: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Received", "Cancelled"],
      default: "Pending",
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

InwardStockSchema.index({ warehouse: 1 });
InwardStockSchema.index({ date: -1 });

const InwardStock = (mongoose.models.InwardStock as mongoose.Model<IInwardStock>) || mongoose.model<IInwardStock>("InwardStock", InwardStockSchema);

export default InwardStock;
