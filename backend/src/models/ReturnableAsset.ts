import mongoose, { Document, Schema } from "mongoose";

/**
 * ReturnableAsset — ledger of returnable packaging assets (crates, ice boxes,
 * thermocol boxes, plastic tubs) issued out on a route and collected back.
 *
 * `missing` is computed at warehouse reconciliation (issued - collected).
 * Additive model for the new logistics flow.
 */
export interface IReturnableAsset extends Document {
  type: "Fish Crate" | "Ice Box" | "Thermocol Box" | "Plastic Tub";
  route: mongoose.Types.ObjectId; // ref DeliveryRoute
  stop?: mongoose.Types.ObjectId; // ref RouteStop (optional)
  issued: number; // loaded out at dispatch
  collected: number; // brought back
  missing: number; // computed at reconciliation

  createdAt: Date;
  updatedAt: Date;
}

const ReturnableAssetSchema = new Schema<IReturnableAsset>(
  {
    type: {
      type: String,
      enum: ["Fish Crate", "Ice Box", "Thermocol Box", "Plastic Tub"],
      required: [true, "Asset type is required"],
    },
    route: {
      type: Schema.Types.ObjectId,
      ref: "DeliveryRoute",
      required: [true, "Route is required"],
    },
    stop: {
      type: Schema.Types.ObjectId,
      ref: "RouteStop",
    },
    issued: {
      type: Number,
      default: 0,
      min: 0,
    },
    collected: {
      type: Number,
      default: 0,
      min: 0,
    },
    missing: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
ReturnableAssetSchema.index({ route: 1, type: 1 });

const ReturnableAsset =
  (mongoose.models.ReturnableAsset as mongoose.Model<IReturnableAsset>) ||
  mongoose.model<IReturnableAsset>("ReturnableAsset", ReturnableAssetSchema);

export default ReturnableAsset;
