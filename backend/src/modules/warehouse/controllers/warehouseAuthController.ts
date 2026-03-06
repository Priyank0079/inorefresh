import { Request, Response } from "express";
import Warehouse from "../../../models/Warehouse";
import {
  sendOTP as sendOTPService,
  verifyOTP as verifyOTPService,
} from "../../../services/otpService";
import { generateToken } from "../../../services/jwtService";
import { asyncHandler } from "../../../utils/asyncHandler";

/**
 * Login Warehouse with email and password
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  // Find Warehouse
  let warehouse = await Warehouse.findOne({ email }).select("+password");

  if (!warehouse) {
    return res.status(404).json({
      success: false,
      message: "Warehouse not found",
    });
  }

  // Verify Password
  const isMatch = await warehouse.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  if (warehouse.status !== "ACTIVE") {
    return res.status(403).json({
      success: false,
      message: `Warehouse account is ${warehouse.status}`,
    });
  }

  // Generate JWT token
  const token = generateToken(warehouse._id.toString(), "Warehouse");

  return res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      token,
      user: {
        id: warehouse._id,
        warehouseName: warehouse.warehouseName,
        mobile: warehouse.mobile,
        email: warehouse.email,
        storeName: warehouse.storeName,
        status: warehouse.status,
        logo: (warehouse as any).logo,
        address: warehouse.address,
        city: (warehouse as any).city,
      },
    },
  });
});

/**
 * Register new Warehouse
 */
export const register = asyncHandler(async (_req: Request, res: Response) => {
  return res.status(403).json({
    success: false,
    message: "Warehouse self registration is disabled. Contact admin.",
  });
});

/**
 * Get Warehouse's profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const WarehouseId = (req as any).user.userId;

  const warehouseDoc = await Warehouse.findById(WarehouseId).select("-password");
  if (!warehouseDoc) {
    return res.status(404).json({
      success: false,
      message: "Warehouse not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: warehouseDoc,
  });
});

/**
 * Update Warehouse's profile
 */
export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const WarehouseId = (req as any).user.userId;
    const updates = req.body;

    // Prevent updating sensitive fields directly
    const restrictedFields = [
      "password",
      "mobile",
      "email",
      "status",
      "balance",
    ];
    restrictedFields.forEach((field) => delete updates[field]);

    // Handle location update (convert lat/lng to GeoJSON)
    if (updates.latitude && updates.longitude) {
      const latitude = parseFloat(updates.latitude);
      const longitude = parseFloat(updates.longitude);

      if (!isNaN(latitude) && !isNaN(longitude)) {
        // Update GeoJSON location for geospatial queries
        updates.location = {
          type: "Point",
          coordinates: [longitude, latitude], // MongoDB GeoJSON: [longitude, latitude]
        };
        // Ensure string fields are also synchronized
        updates.latitude = latitude.toString();
        updates.longitude = longitude.toString();
      }
    }

    // Handle serviceRadiusKm update
    if (
      updates.serviceRadiusKm !== undefined &&
      updates.serviceRadiusKm !== null &&
      updates.serviceRadiusKm !== ""
    ) {
      const radius =
        typeof updates.serviceRadiusKm === "string"
          ? parseFloat(updates.serviceRadiusKm)
          : Number(updates.serviceRadiusKm);

      if (!isNaN(radius) && radius >= 0.1 && radius <= 100) {
        updates.serviceRadiusKm = radius; // Ensure it's saved as a number
      } else {
        return res.status(400).json({
          success: false,
          message: "Service radius must be between 0.1 and 100 kilometers",
        });
      }
    } else if (
      updates.serviceRadiusKm === "" ||
      updates.serviceRadiusKm === null
    ) {
      // If empty string or null is sent, remove it from updates to keep existing value
      delete updates.serviceRadiusKm;
    }

    // Handle serviceAreaGeo update
    if (updates.serviceAreaGeo) {
      // It is an object, ensure it has type 'Polygon'
      if (!updates.serviceAreaGeo.type) updates.serviceAreaGeo.type = 'Polygon';
    } else if (updates.serviceAreaGeo === null) {
      // If explicitly null, user wants to remove the Polygon (switch to Radius)
      // We use $unset for this field
      // Note: findByIdAndUpdate with flattened object including $unset
      updates.$unset = { ...updates.$unset, serviceAreaGeo: 1 };
      delete updates.serviceAreaGeo;
    }

    const warehouseDoc = await Warehouse.findByIdAndUpdate(WarehouseId, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!warehouseDoc) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: warehouseDoc,
    });
  },
);

/**
 * Toggle shop status (Open/Close)
 */
export const toggleShopStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const WarehouseId = (req as any).user.userId;

    const warehouseDoc = await Warehouse.findById(WarehouseId);

    if (!warehouseDoc) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    // Handle undefined case - if isShopOpen is undefined, default to true (open) then toggle to false
    // This ensures backward compatibility with Warehouses created before this field was added
    if ((warehouseDoc as any).isShopOpen === undefined) {
      (warehouseDoc as any).isShopOpen = false; // Toggle from default "open" to "closed"
    } else {
      (warehouseDoc as any).isShopOpen = !(warehouseDoc as any).isShopOpen; // Normal toggle
    }

    // Fix invalid GeoJSON location objects
    // MongoDB requires that if location.type is "Point", coordinates must be a valid array
    if (warehouseDoc.location && warehouseDoc.location.type === "Point") {
      if (
        !warehouseDoc.location.coordinates ||
        !Array.isArray(warehouseDoc.location.coordinates) ||
        warehouseDoc.location.coordinates.length !== 2
      ) {
        // Invalid location object - remove it to prevent validation error
        (warehouseDoc as any).location = undefined;
      }
    }

    await warehouseDoc.save();

    return res.status(200).json({
      success: true,
      message: `Shop is now ${(warehouseDoc as any).isShopOpen ? "Open" : "Closed"}`,
      data: { isShopOpen: (warehouseDoc as any).isShopOpen },
    });
  },
);
