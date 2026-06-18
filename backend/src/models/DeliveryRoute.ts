import mongoose, { Document, Schema } from "mongoose";

/**
 * DeliveryRoute — one vehicle's planned delivery route for a single day.
 *
 * Part of the new route-based logistics flow. This is additive and does not
 * replace or alter the existing on-demand DeliveryAssignment model.
 */
export interface IDeliveryRoute extends Document {
  routeName: string;
  routeNumber: string;
  date: Date; // the delivery day this route is for

  status:
    | "Planned"
    | "Assigned"
    | "Accepted"
    | "Loaded"
    | "Out For Delivery"
    | "Completed"
    | "Reconciled";

  // Vehicle
  vehicle: {
    vehicleNumber: string;
    vehicleType?: string;
    isPartner?: boolean;
  };

  // Driver
  driver?: mongoose.Types.ObjectId; // ref Delivery

  // Stops (ordered sequence)
  stops: mongoose.Types.ObjectId[]; // ref RouteStop

  // Totals
  totals: {
    orderCount: number;
    totalWeight: number;
    estimatedTimeMins: number;
  };

  // Cold-chain timeline
  timeline: {
    plannedAt?: Date;
    assignedAt?: Date;
    acceptedAt?: Date;
    loadedAt?: Date;
    dispatchedAt?: Date;
    completedAt?: Date;
    reconciledAt?: Date;
  };

  loadingOtp?: string;
  distanceKm?: number;

  // Who created the route (Admin or Warehouse)
  createdBy?: mongoose.Types.ObjectId;
  createdByModel?: "Admin" | "Warehouse";

  createdAt: Date;
  updatedAt: Date;
}

const DeliveryRouteSchema = new Schema<IDeliveryRoute>(
  {
    routeName: {
      type: String,
      required: [true, "Route name is required"],
      trim: true,
    },
    routeNumber: {
      type: String,
      required: [true, "Route number is required"],
      unique: true,
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Route date is required"],
      default: Date.now,
    },
    status: {
      type: String,
      enum: [
        "Planned",
        "Assigned",
        "Accepted",
        "Loaded",
        "Out For Delivery",
        "Completed",
        "Reconciled",
      ],
      default: "Planned",
    },

    vehicle: {
      vehicleNumber: { type: String, required: true, trim: true },
      vehicleType: { type: String, trim: true },
      isPartner: { type: Boolean, default: false },
    },

    driver: {
      type: Schema.Types.ObjectId,
      ref: "Delivery",
    },

    stops: [
      {
        type: Schema.Types.ObjectId,
        ref: "RouteStop",
      },
    ],

    totals: {
      orderCount: { type: Number, default: 0, min: 0 },
      totalWeight: { type: Number, default: 0, min: 0 },
      estimatedTimeMins: { type: Number, default: 0, min: 0 },
    },

    timeline: {
      plannedAt: { type: Date },
      assignedAt: { type: Date },
      acceptedAt: { type: Date },
      loadedAt: { type: Date },
      dispatchedAt: { type: Date },
      completedAt: { type: Date },
      reconciledAt: { type: Date },
    },

    loadingOtp: { type: String },
    distanceKm: { type: Number, min: 0 },

    createdBy: {
      type: Schema.Types.ObjectId,
      refPath: "createdByModel",
    },
    createdByModel: {
      type: String,
      enum: ["Admin", "Warehouse"],
    },
  },
  {
    timestamps: true,
  },
);

// Auto-generate route number if missing
DeliveryRouteSchema.pre("validate", function (this: IDeliveryRoute, next) {
  if (!this.routeNumber) {
    const ts = Date.now().toString().slice(-8);
    const rand = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, "0");
    this.routeNumber = `RT${ts}${rand}`;
  }
  next();
});

// Indexes
DeliveryRouteSchema.index({ date: -1, status: 1 });
DeliveryRouteSchema.index({ driver: 1, date: -1 });

const DeliveryRoute =
  (mongoose.models.DeliveryRoute as mongoose.Model<IDeliveryRoute>) ||
  mongoose.model<IDeliveryRoute>("DeliveryRoute", DeliveryRouteSchema);

export default DeliveryRoute;
