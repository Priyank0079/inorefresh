import { Request, Response } from "express";
import Customer from "../../../models/Customer";
import HorecaUser from "../../../models/HorecaUser";
import RetailerUser from "../../../models/RetailerUser";
import { asyncHandler } from "../../../utils/asyncHandler";

/**
 * Get customer profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId || !["Customer", "horeca", "retailer"].includes((req as any).user?.userType)) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized or not a customer",
    });
  }

  const userType = (req as any).user?.userType;

  let customer;
  if (userType === 'horeca') {
    customer = await HorecaUser.findById(userId);
  } else if (userType === 'retailer') {
    customer = await RetailerUser.findById(userId);
  } else {
    customer = await Customer.findById(userId);
  }

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: "User profile not found",
    });
  }

  // Normalize data for frontend
  const normalizedData = {
    id: customer._id,
    name: customer.name || customer.ownerName || customer.shopName,
    phone: customer.phone || customer.ownerPhone || customer.shopPhone,
    email: customer.email || "",
    dateOfBirth: customer.dateOfBirth,
    registrationDate: customer.registrationDate || customer.createdAt,
    status: customer.status,
    refCode: customer.refCode,
    walletAmount: customer.walletAmount,
    totalOrders: customer.totalOrders || 0,
    totalSpent: customer.totalSpent || 0,
    latitude: customer.latitude,
    longitude: customer.longitude,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    pincode: customer.pincode,
    locationUpdatedAt: customer.locationUpdatedAt,
  };

  return res.status(200).json({
    success: true,
    message: "Profile retrieved successfully",
    data: normalizedData,
  });
});

/**
 * Update customer profile
 */
export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { name, email, dateOfBirth, notificationPreferences, accountPrivacy } = req.body;


    if (!userId || !["Customer", "horeca", "retailer"].includes((req as any).user?.userType)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized or not a customer",
      });
    }

    const userType = (req as any).user?.userType;

    let customer;
    let Model: any;

    if (userType === 'horeca') {
      Model = HorecaUser;
    } else if (userType === 'retailer') {
      Model = RetailerUser;
    } else {
      Model = Customer;
    }

    customer = await Model.findById(userId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    // Update fields if provided
    if (name) {
      if (customer.name !== undefined) customer.name = name;
      if (customer.ownerName !== undefined) customer.ownerName = name;
    }

    if (email && customer.email !== undefined) {
      // Check if email is already taken by another user in the SAME collection
      const existingUser = await Model.findOne({
        email,
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email already in use",
        });
      }

      customer.email = email;
    }

    if (dateOfBirth && customer.dateOfBirth !== undefined) customer.dateOfBirth = new Date(dateOfBirth);
    if (notificationPreferences && customer.notificationPreferences) {
      customer.notificationPreferences = { ...customer.notificationPreferences, ...notificationPreferences };
    }
    if (accountPrivacy && customer.accountPrivacy) {
      customer.accountPrivacy = { ...customer.accountPrivacy, ...accountPrivacy };
    }


    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: customer._id,
        name: customer.name || customer.ownerName || customer.shopName,
        phone: customer.phone || customer.ownerPhone || customer.shopPhone,
        email: customer.email || "",
        dateOfBirth: customer.dateOfBirth,
        registrationDate: customer.registrationDate || customer.createdAt,
        status: customer.status,
        refCode: customer.refCode,
        walletAmount: customer.walletAmount,
        totalOrders: customer.totalOrders || 0,
        totalSpent: customer.totalSpent || 0,
        latitude: customer.latitude,
        longitude: customer.longitude,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
        notificationPreferences: customer.notificationPreferences,
        accountPrivacy: customer.accountPrivacy,
        donationStats: customer.donationStats,
      },

    });
  }
);

/**
 * Update customer location
 */
export const updateLocation = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { latitude, longitude, address, city, state, pincode } = req.body;

    if (!userId || !["Customer", "horeca", "retailer"].includes((req as any).user?.userType)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized or not a customer",
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const userType = (req as any).user?.userType;
    let Model: any;

    if (userType === 'horeca') {
      Model = HorecaUser;
    } else if (userType === 'retailer') {
      Model = RetailerUser;
    } else {
      Model = Customer;
    }

    const customer = await Model.findById(userId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    // Update location fields
    customer.latitude = latitude;
    customer.longitude = longitude;
    customer.address = address;
    customer.city = city;
    customer.state = state;
    customer.pincode = pincode;
    customer.locationUpdatedAt = new Date();

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: {
        latitude: customer.latitude,
        longitude: customer.longitude,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
        locationUpdatedAt: customer.locationUpdatedAt,
      },
    });
  }
);

/**
 * Get customer location
 */
export const getLocation = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId || !["Customer", "horeca", "retailer"].includes((req as any).user?.userType)) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized or not a customer",
    });
  }

  const userType = (req as any).user?.userType;
  let Model: any;

  if (userType === 'horeca') {
    Model = HorecaUser;
  } else if (userType === 'retailer') {
    Model = RetailerUser;
  } else {
    Model = Customer;
  }

  const customer = await Model.findById(userId).select(
    "latitude longitude address city state pincode locationUpdatedAt"
  );

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: "User profile not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Location retrieved successfully",
    data: {
      latitude: customer.latitude,
      longitude: customer.longitude,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      pincode: customer.pincode,
      locationUpdatedAt: customer.locationUpdatedAt,
    },
  });
});
