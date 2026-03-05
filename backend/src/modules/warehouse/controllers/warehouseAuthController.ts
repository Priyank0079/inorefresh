import { Request, Response } from "express";
import Warehouse from "../../../models/Warehouse";
import {
  sendOTP as sendOTPService,
  verifyOTP as verifyOTPService,
} from "../../../services/otpService";
import { generateToken } from "../../../services/jwtService";
import { asyncHandler } from "../../../utils/asyncHandler";

/**
 * Send OTP to Warehouse mobile number
 */
export const sendOTP = asyncHandler(async (req: Request, res: Response) => {
  const { mobile } = req.body;

  if (mobile === "9111966732") {
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully (Test Credential: 1234)",
    });
  }

  // Check if Warehouse exists with this mobile
  const warehouse = await Warehouse.findOne({ mobile });
  if (!warehouse) {
    return res.status(404).json({
      success: false,
      message: "Warehouse not found with this mobile number",
    });
  }

  // Send OTP - for login, always use default OTP
  const result = await sendOTPService(mobile, "Warehouse", true);

  return res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * Verify OTP and login Warehouse
 */
export const verifyOTP = asyncHandler(async (req: Request, res: Response) => {
  const { mobile, otp } = req.body;

  if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({
      success: false,
      message: "Valid 10-digit mobile number is required",
    });
  }

  if (!otp || !/^[0-9]{4}$/.test(otp)) {
    return res.status(400).json({
      success: false,
      message: "Valid 4-digit OTP is required",
    });
  }

  // Verify OTP
  let isValid = false;
  if (mobile === "9111966732" && otp === "1234") {
    isValid = true;
  } else {
    isValid = await verifyOTPService(mobile, otp, "Warehouse");
  }

  if (!isValid) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired OTP",
    });
  }

  // Find Warehouse
  let warehouse = await Warehouse.findOne({ mobile }).select("-password");

  // Auto-create test warehouse if it doesn't exist
  if (!warehouse && mobile === "9111966732") {
    warehouse = await Warehouse.create({
      warehouseName: "Test Warehouse",
      managerName: "Test Manager",
      mobile: "9111966732",
      email: "testwarehouse@zetomart.com",
      storeName: "Test Warehouse Store",
      address: "Test Address, City",
      location: { type: "Point", coordinates: [77.5946, 12.9716] }, // Bangalore
      status: "ACTIVE",
      role: "warehouse"
    });
  }

  if (!warehouse) {
    return res.status(404).json({
      success: false,
      message: "Warehouse not found",
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

  const Warehouse = await Warehouse.findById(WarehouseId).select("-password");
  if (!Warehouse) {
    return res.status(404).json({
      success: false,
      message: "Warehouse not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: Warehouse,
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

    const Warehouse = await Warehouse.findByIdAndUpdate(WarehouseId, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!Warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: Warehouse,
    });
  },
);

/**
 * Toggle shop status (Open/Close)
 */
export const toggleShopStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const WarehouseId = (req as any).user.userId;

    const Warehouse = await Warehouse.findById(WarehouseId);

    if (!Warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    // Handle undefined case - if isShopOpen is undefined, default to true (open) then toggle to false
    // This ensures backward compatibility with Warehouses created before this field was added
    if (Warehouse.isShopOpen === undefined) {
      Warehouse.isShopOpen = false; // Toggle from default "open" to "closed"
    } else {
      Warehouse.isShopOpen = !Warehouse.isShopOpen; // Normal toggle
    }

    // Fix invalid GeoJSON location objects
    // MongoDB requires that if location.type is "Point", coordinates must be a valid array
    if (Warehouse.location && Warehouse.location.type === "Point") {
      if (
        !Warehouse.location.coordinates ||
        !Array.isArray(Warehouse.location.coordinates) ||
        Warehouse.location.coordinates.length !== 2
      ) {
        // Invalid location object - remove it to prevent validation error
        Warehouse.location = undefined;
      }
    }

    await Warehouse.save();

    return res.status(200).json({
      success: true,
      message: `Shop is now ${Warehouse.isShopOpen ? "Open" : "Closed"}`,
      data: { isShopOpen: Warehouse.isShopOpen },
    });
  },
);
