
import mongoose, { Document, Schema } from "mongoose";

export interface IReturn extends Document {
  order: mongoose.Types.ObjectId;
  orderItem: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;

  // Return Info
  reason: string;
  description?: string;
  status: "Pending" | "Approved" | "Rejected" | "Processing" | "Completed" | "REQUESTED" | "UNDER_REVIEW" | "COLLECTED_BY_RIDER" | "IN_TRANSIT_TO_WAREHOUSE" | "RECEIVED_AT_WAREHOUSE" | "REFUND_PENDING" | "REFUND_APPROVED" | "REFUNDED";

  // Items
  quantity: number;
  acceptedQuantity: number;
  orderedQuantity: number;
  images?: string[]; // Images of returned items
  videos?: string[];

  // Logistics tracking
  warehouse?: mongoose.Types.ObjectId;
  deliveryBoy?: mongoose.Types.ObjectId;
  warehouseVerificationOtp?: string;
  warehouseVerificationOtpExpiresAt?: Date;
  warehouseVerificationOtpVerified?: boolean;
  wholesalerStatus?: "Approved" | "Rejected" | "Escalated_To_Admin";
  escalatedAt?: Date;
  escalatedReason?: string;
  riderWaitingStartedAt?: Date;
  riderWaitingLimitMinutes?: number;
  reverseLogisticsCode?: string;
  proofOfPickupEvidence?: string[];
  riderRemarks?: string;

  // Processing
  processedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  rejectionReason?: string;

  // Pickup
  pickupScheduled?: Date;
  pickupCompleted?: Date;
  pickupAddress?: {
    address: string;
    city: string;
    pincode: string;
  };

  // Refund
  refundAmount?: number;
  refundId?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const ReturnSchema = new Schema<IReturn>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order is required"],
    },
    orderItem: {
      type: Schema.Types.ObjectId,
      ref: "OrderItem",
      required: [true, "Order item is required"],
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },

    // Return Info
    reason: {
      type: String,
      required: [true, "Return reason is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "Pending", "Approved", "Rejected", "Processing", "Completed",
        "REQUESTED", "UNDER_REVIEW", "COLLECTED_BY_RIDER",
        "IN_TRANSIT_TO_WAREHOUSE", "RECEIVED_AT_WAREHOUSE",
        "REFUND_PENDING", "REFUND_APPROVED", "REFUNDED"
      ],
      default: "Pending",
    },

    // Items
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    acceptedQuantity: {
      type: Number,
      required: [true, "Accepted quantity is required"],
      default: 0,
    },
    orderedQuantity: {
      type: Number,
      required: [true, "Ordered quantity is required"],
      default: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    videos: {
      type: [String],
      default: [],
    },

    // Logistics tracking
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
    },
    deliveryBoy: {
      type: Schema.Types.ObjectId,
      ref: "Delivery",
    },
    warehouseVerificationOtp: {
      type: String,
    },
    warehouseVerificationOtpExpiresAt: {
      type: Date,
    },
    warehouseVerificationOtpVerified: {
      type: Boolean,
      default: false,
    },
    wholesalerStatus: {
      type: String,
      enum: ["Approved", "Rejected", "Escalated_To_Admin"],
    },
    escalatedAt: {
      type: Date,
    },
    escalatedReason: {
      type: String,
      trim: true,
    },
    riderWaitingStartedAt: {
      type: Date,
    },
    riderWaitingLimitMinutes: {
      type: Number,
      default: 10,
    },
    reverseLogisticsCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    proofOfPickupEvidence: {
      type: [String],
      default: [],
    },
    riderRemarks: {
      type: String,
      trim: true,
    },

    // Processing
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    processedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },

    // Pickup
    pickupScheduled: {
      type: Date,
    },
    pickupCompleted: {
      type: Date,
    },
    pickupAddress: {
      address: String,
      city: String,
      pincode: String,
    },

    // Refund
    refundAmount: {
      type: Number,
      min: [0, "Refund amount cannot be negative"],
    },
    refundId: {
      type: Schema.Types.ObjectId,
      ref: "Refund",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ReturnSchema.index({ order: 1 });
ReturnSchema.index({ customer: 1 });
ReturnSchema.index({ status: 1 });

const Return = (mongoose.models.Return as mongoose.Model<IReturn>) || mongoose.model<IReturn>("Return", ReturnSchema);

export default Return;
