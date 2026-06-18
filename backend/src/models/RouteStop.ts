import mongoose, { Document, Schema } from "mongoose";

/**
 * RouteStop — one retailer stop inside a DeliveryRoute.
 *
 * Captures everything that happens at a single shop: arrival, delivery,
 * confirmation (OTP / Signature / Photo), payment, on-spot returns, and
 * returnable-asset (crate/icebox) collection. Additive — does not change
 * the existing Order flow.
 */
export interface IRouteStop extends Document {
  route: mongoose.Types.ObjectId; // ref DeliveryRoute
  order: mongoose.Types.ObjectId; // ref Order
  sequence: number; // stop order 1..N

  retailer: {
    name: string;
    address: string;
    contact?: string;
    location?: {
      type: "Point";
      coordinates: [number, number]; // [lng, lat]
    };
  };

  invoiceAmount?: number;
  orderWeight?: number;

  status: "Pending" | "Arrived" | "Delivered" | "Partial" | "Failed";

  arrivedAt?: Date;
  deliveredAt?: Date;
  gpsAtArrival?: {
    latitude?: number;
    longitude?: number;
  };

  confirmation?: {
    method?: "OTP" | "Signature" | "Photo";
    proofUrl?: string;
    otpVerified?: boolean;
  };

  payment?: {
    method?: "Cash" | "UPI" | "Bank Transfer";
    amountReceived?: number;
    referenceNo?: string;
    proofUrl?: string;
    status?: "Pending" | "Collected";
  };

  returns?: Array<{
    reason: string;
    qtyKg?: number;
    photoUrl?: string;
    action?: "Replacement" | "Credit Note" | "Return to Warehouse";
  }>;

  assets?: Array<{
    type: "Fish Crate" | "Ice Box" | "Thermocol Box" | "Plastic Tub";
    qtyCollected: number;
  }>;

  failureReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const RouteStopSchema = new Schema<IRouteStop>(
  {
    route: {
      type: Schema.Types.ObjectId,
      ref: "DeliveryRoute",
      required: [true, "Route is required"],
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order is required"],
    },
    sequence: {
      type: Number,
      required: [true, "Stop sequence is required"],
      min: 1,
    },

    retailer: {
      name: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      contact: { type: String, trim: true },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number], // [lng, lat]
        },
      },
    },

    invoiceAmount: { type: Number, min: 0 },
    orderWeight: { type: Number, min: 0 },

    status: {
      type: String,
      enum: ["Pending", "Arrived", "Delivered", "Partial", "Failed"],
      default: "Pending",
    },

    arrivedAt: { type: Date },
    deliveredAt: { type: Date },
    gpsAtArrival: {
      latitude: { type: Number },
      longitude: { type: Number },
    },

    confirmation: {
      method: {
        type: String,
        enum: ["OTP", "Signature", "Photo"],
      },
      proofUrl: { type: String, trim: true },
      otpVerified: { type: Boolean, default: false },
    },

    payment: {
      method: {
        type: String,
        enum: ["Cash", "UPI", "Bank Transfer"],
      },
      amountReceived: { type: Number, min: 0 },
      referenceNo: { type: String, trim: true },
      proofUrl: { type: String, trim: true },
      status: {
        type: String,
        enum: ["Pending", "Collected"],
        default: "Pending",
      },
    },

    returns: [
      {
        reason: { type: String, required: true, trim: true },
        qtyKg: { type: Number, min: 0 },
        photoUrl: { type: String, trim: true },
        action: {
          type: String,
          enum: ["Replacement", "Credit Note", "Return to Warehouse"],
        },
      },
    ],

    assets: [
      {
        type: {
          type: String,
          enum: ["Fish Crate", "Ice Box", "Thermocol Box", "Plastic Tub"],
          required: true,
        },
        qtyCollected: { type: Number, default: 0, min: 0 },
      },
    ],

    failureReason: { type: String, trim: true },
  },
  {
    timestamps: true,
  },
);

// Indexes
RouteStopSchema.index({ route: 1, sequence: 1 });
RouteStopSchema.index({ order: 1 });

const RouteStop =
  (mongoose.models.RouteStop as mongoose.Model<IRouteStop>) ||
  mongoose.model<IRouteStop>("RouteStop", RouteStopSchema);

export default RouteStop;
