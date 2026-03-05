import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import Seller from "../../../models/Seller";
import Notification from "../../../models/Notification";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeCoordinate = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : parseFloat(String(value));
  return parsed;
};

/**
 * Create seller account (Admin only onboarding flow)
 */
export const createSeller = asyncHandler(async (req: Request, res: Response) => {
  const {
    shopName,
    ownerName,
    phone,
    email,
    password,
    shopAddress,
    location,
  } = req.body || {};

  if (
    !shopName ||
    !ownerName ||
    !phone ||
    !email ||
    !password ||
    !shopAddress ||
    !location
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Required fields: shopName, ownerName, phone, email, password, shopAddress, location",
    });
  }

  if (!/^[0-9]{10}$/.test(String(phone))) {
    return res.status(400).json({
      success: false,
      message: "Phone must be a valid 10-digit number",
    });
  }

  if (!EMAIL_REGEX.test(String(email))) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address",
    });
  }

  if (String(password).length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long",
    });
  }

  const latitude = normalizeCoordinate(location.latitude);
  const longitude = normalizeCoordinate(location.longitude);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return res.status(400).json({
      success: false,
      message: "Location must include valid latitude and longitude",
    });
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({
      success: false,
      message: "Invalid location coordinates",
    });
  }

  const existingSeller = await Seller.findOne({
    $or: [{ email: String(email).toLowerCase() }, { mobile: String(phone) }],
  });

  if (existingSeller) {
    return res.status(409).json({
      success: false,
      message: "Seller already exists with this phone or email",
    });
  }

  const seller = await Seller.create({
    sellerName: String(ownerName).trim(),
    storeName: String(shopName).trim(),
    mobile: String(phone).trim(),
    email: String(email).trim().toLowerCase(),
    password: String(password),
    address: String(shopAddress).trim(),
    searchLocation: String(shopAddress).trim(),
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    location: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
    serviceRadiusKm: 10,
    category: "General",
    commission: 0,
    balance: 0,
    requireProductApproval: false,
    viewCustomerDetails: false,
    status: "ACTIVE",
    role: "seller",
    createdBy: "ADMIN",
  });

  await Notification.create({
    recipientType: "Seller",
    recipientId: seller._id,
    title: "Seller Account Created",
    message:
      "Your seller account has been created by admin. Login using your email and password.",
    type: "System",
    priority: "High",
    createdBy: req.user?.userId,
  });

  return res.status(201).json({
    success: true,
    message: "Seller account created successfully",
    data: {
      _id: seller._id,
      shopName: seller.storeName,
      ownerName: seller.sellerName,
      phone: seller.mobile,
      email: seller.email,
      shopAddress: seller.address,
      status: seller.status,
      role: seller.role,
      createdBy: seller.createdBy,
      location: {
        latitude,
        longitude,
      },
    },
  });
});

/**
 * Get all sellers (for dropdowns/lists)
 */
export const getAllSellers = asyncHandler(async (_req: Request, res: Response) => {
    const sellers = await Seller.find({})
        .select("sellerName storeName profile status role createdBy")
        .sort({ storeName: 1 });

    return res.status(200).json({
        success: true,
        message: "Sellers fetched successfully",
        data: sellers,
    });
});
