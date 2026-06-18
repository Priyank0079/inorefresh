import mongoose, { Document, Schema } from "mongoose";

export interface IOrder extends Document {
  // Order Info
  orderNumber: string;
  invoiceNumber?: string;
  orderDate: Date;
  timeSlot?: string;

  // Customer Info
  customer: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;

  // Delivery Info
  deliveryAddress: {
    address: string;
    city: string;
    state?: string;
    pincode: string;
    landmark?: string;
    latitude?: number;
    longitude?: number;
  };

  // Order Items
  items: mongoose.Types.ObjectId[]; // References to OrderItem

  // Pricing
  subtotal: number;
  tax: number;
  taxBreakdown?: Array<{
    itemId: string;
    itemName: string;
    taxRate: number;
    amount: number;
  }>;
  shipping: number;
  platformFee: number;
  discount: number;
  couponCode?: string;
  total: number;
  grandTotal?: number; // Alias or computed total used in some controllers

  // Payment
  paymentMethod: string;
  paymentStatus: "Pending" | "Paid" | "Failed" | "Refunded";
  paymentId?: string;
  walletAmountUsed?: number;

  // Order Status
  status:
  | "Received"
  | "Confirmed"
  | "Accepted"
  | "Pending"
  | "Processed"
  | "Shipped"
  | "Picked up"
  | "On the way"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled"
  | "Rejected"
  | "Returned"
  | "Verification Pending"
  | "Partially Returned"
  | "Fully Returned"
  | "Return Under Review";

  // Logistics flow: how delivery was confirmed at the retailer (additive)
  confirmationMethod?: "OTP" | "Signature" | "Photo";
  confirmationProofUrl?: string;

  // Delivery Assignment
  deliveryBoy?: mongoose.Types.ObjectId;
  deliveryBoyStatus?:
  | "Assigned"
  | "Picked Up"
  | "In Transit"
  | "Delivered"
  | "Failed";
  assignedAt?: Date;

  // Tracking
  trackingNumber?: string;
  estimatedDeliveryDate?: Date;
  deliveredAt?: Date;

  // Delivery OTP
  deliveryOtp?: string;
  deliveryOtpExpiresAt?: Date;
  deliveryOtpVerified?: boolean;
  deliveryOtpSentAt?: Date;
  invoiceEnabled?: boolean;
  deliveryDistanceKm?: number;

  // Inspection & Return Tracking
  returnAllowed?: boolean;
  inspectionStartedAt?: Date;
  inspectionExpiresAt?: Date;
  inspectionDurationMinutes?: number;
  riderLatitudeAtInspection?: number;
  riderLongitudeAtInspection?: number;
  riderStatusDuringInspection?: "WAITING_FOR_RETURN_APPROVAL" | "NORMAL_DELIVERY" | "IDLE" | "WAITING_FOR_CUSTOMER_VERIFICATION";
  isVerifiedByCustomer?: boolean;

  // Warehouse Pickups (for orders fulfilled by warehouses)
  warehousePickups?: Array<{
    warehouse: mongoose.Types.ObjectId;
    pickedUpAt?: Date;
    pickedUpBy?: mongoose.Types.ObjectId; // delivery boy who picked up
    latitude?: number; // location where pickup was confirmed
    longitude?: number;
  }>;

  // Auto-assigned nearest warehouse (set at order creation)
  assignedWarehouse?: mongoose.Types.ObjectId;
  assignedWarehouseName?: string;
  assignedWarehouseDistanceKm?: number;

  // Notes
  adminNotes?: string;
  customerNotes?: string;
  deliveryInstructions?: string;
  specialRequests?: string;

  // Cancellation/Return
  cancellationReason?: string;
  cancelledAt?: Date;
  cancelledBy?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    // Order Info
    orderNumber: {
      type: String,
      required: [true, "Order number is required"],
      unique: true,
      trim: true,
    },
    invoiceNumber: {
      type: String,
      trim: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    timeSlot: {
      type: String,
      trim: true,
    },

    // Customer Info
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      default: "",
    },
    customerPhone: {
      type: String,
      required: [true, "Customer phone is required"],
      trim: true,
    },

    // Delivery Info
    deliveryAddress: {
      address: {
        type: String,
        required: [true, "Delivery address is required"],
        trim: true,
      },
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      pincode: {
        type: String,
        required: [true, "Pincode is required"],
        trim: true,
      },
      landmark: {
        type: String,
        trim: true,
      },
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
    },

    // Order Items
    items: [
      {
        type: Schema.Types.ObjectId,
        ref: "OrderItem",
      },
    ],

    // Pricing
    subtotal: {
      type: Number,
      required: [true, "Subtotal is required"],
      min: [0, "Subtotal cannot be negative"],
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, "Tax cannot be negative"],
    },
    taxBreakdown: [
      {
        itemId: String,
        itemName: String,
        taxRate: Number,
        amount: Number,
      },
    ],
    shipping: {
      type: Number,
      default: 0,
      min: [0, "Shipping cannot be negative"],
    },
    platformFee: {
      type: Number,
      default: 0,
      min: [0, "Platform fee cannot be negative"],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },
    couponCode: {
      type: String,
      trim: true,
    },
    total: {
      type: Number,
      required: [true, "Total is required"],
      min: [0, "Total cannot be negative"],
    },
    grandTotal: {
      type: Number,
    },

    // Payment
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },
    paymentId: {
      type: String,
      trim: true,
    },
    walletAmountUsed: {
      type: Number,
      default: 0,
    },

    // Order Status
    status: {
      type: String,
      enum: [
        "Received",
        "Confirmed",
        "Accepted",
        "Pending",
        "Processed",
        "Shipped",
        "Picked up",
        "On the way",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
        "Rejected",
        "Returned",
        "Verification Pending",
        "Partially Returned",
        "Fully Returned",
        "Return Under Review",
      ],
      default: "Received",
    },

    // Logistics flow: delivery confirmation method/proof (additive)
    confirmationMethod: {
      type: String,
      enum: ["OTP", "Signature", "Photo"],
    },
    confirmationProofUrl: {
      type: String,
      trim: true,
    },

    // Delivery Assignment
    deliveryBoy: {
      type: Schema.Types.ObjectId,
      ref: "Delivery",
    },
    deliveryBoyStatus: {
      type: String,
      enum: ["Assigned", "Picked Up", "In Transit", "Delivered", "Failed"],
    },
    assignedAt: {
      type: Date,
    },

    // Inspection & Return Tracking
    returnAllowed: {
      type: Boolean,
      default: false,
    },
    inspectionStartedAt: {
      type: Date,
    },
    inspectionExpiresAt: {
      type: Date,
    },
    inspectionDurationMinutes: {
      type: Number,
      default: 10,
    },
    riderLatitudeAtInspection: {
      type: Number,
    },
    riderLongitudeAtInspection: {
      type: Number,
    },
    riderStatusDuringInspection: {
      type: String,
      enum: ["WAITING_FOR_RETURN_APPROVAL", "NORMAL_DELIVERY", "IDLE", "WAITING_FOR_CUSTOMER_VERIFICATION"],
      default: "IDLE",
    },
    isVerifiedByCustomer: {
      type: Boolean,
      default: false,
    },

    // Tracking
    trackingNumber: {
      type: String,
      trim: true,
    },
    estimatedDeliveryDate: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },

    // Delivery OTP
    deliveryOtp: {
      type: String,
      trim: true,
    },
    deliveryOtpExpiresAt: {
      type: Date,
    },
    deliveryOtpVerified: {
      type: Boolean,
      default: false,
    },
    deliveryOtpSentAt: {
      type: Date,
    },
    invoiceEnabled: {
      type: Boolean,
      default: false,
    },
    deliveryDistanceKm: {
      type: Number,
    },

    // Warehouse Pickups
    warehousePickups: [
      {
        warehouse: {
          type: Schema.Types.ObjectId,
          ref: "Warehouse",
          required: true,
        },
        pickedUpAt: { type: Date },
        pickedUpBy: { type: Schema.Types.ObjectId, ref: "Delivery" },
        latitude: { type: Number },
        longitude: { type: Number },
      },
    ],

    // Auto-assigned nearest warehouse
    assignedWarehouse: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      default: null,
    },
    assignedWarehouseName: {
      type: String,
      trim: true,
    },
    assignedWarehouseDistanceKm: {
      type: Number,
    },

    // Notes
    adminNotes: {
      type: String,
      trim: true,
    },
    customerNotes: {
      type: String,
      trim: true,
    },
    deliveryInstructions: {
      type: String,
      trim: true,
    },
    specialRequests: {
      type: String,
      trim: true,
    },

    // Cancellation/Return
    cancellationReason: {
      type: String,
      trim: true,
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  },
);

// Generate order number before validation
OrderSchema.pre("validate", async function (this: IOrder, next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    this.orderNumber = `ORD${timestamp}${random}`;
  }
  next();
});

// Indexes for faster queries
OrderSchema.index({ customer: 1, orderDate: -1 });
OrderSchema.index({ status: 1, orderDate: -1 }); // compound for filtered list
OrderSchema.index({ orderDate: -1 });
OrderSchema.index({ deliveryBoy: 1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ orderNumber: "text", customerName: "text", customerEmail: "text", customerPhone: "text" }); // text search

const Order =
  (mongoose.models.Order as mongoose.Model<IOrder>) ||
  mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
