import { Request, Response } from "express";
import Delivery from "../../../models/Delivery";
import Order from "../../../models/Order";
import {
  sendSmsOtp as sendSmsOtpService,
  verifySmsOtp as verifySmsOtpService,
} from "../../../services/otpService";
import { generateToken } from "../../../services/jwtService";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendNotification } from "../../../services/notificationService";
import Admin from "../../../models/Admin";
// import { uploadDocument } from "../../../services/uploadService"; // File does not exist

/**
 * Send SMS OTP to delivery mobile number
 */
export const sendSmsOtp = asyncHandler(async (req: Request, res: Response) => {
  const { mobile } = req.body;

  if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({
      success: false,
      message: "Valid 10-digit mobile number is required",
    });
  }

  // Check if delivery partner exists with this mobile
  const delivery = await Delivery.findOne({ mobile });
  if (!delivery) {
    return res.status(400).json({
      success: false,
      message:
        "Delivery partner not found with this mobile number. Please register first.",
    });
  }

  // Send SMS OTP
  const result = await sendSmsOtpService(mobile, "Delivery");

  return res.status(200).json({
    success: true,
    message: result.message,
    sessionId: result.sessionId,
  });
});

/**
 * Verify SMS OTP and login delivery partner
 */
export const verifySmsOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const { mobile, otp, sessionId } = req.body;

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

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
    }

    // Verify SMS OTP
    const isValid = await verifySmsOtpService(
      sessionId,
      otp,
      mobile,
      "Delivery",
    );

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Find delivery partner
    const delivery = await Delivery.findOne({ mobile }).select("-password");

    if (!delivery) {
      return res.status(401).json({
        success: false,
        message: "Delivery partner not found. Please Register first.",
      });
    }

    // Block login until an admin approves the account — registration sets
    // status to "Inactive" and the dashboard's approval toggle is the only
    // thing that flips it to "Active". Without this check the approval step
    // is purely cosmetic.
    if (delivery.status !== "Active") {
      return res.status(403).json({
        success: false,
        message:
          "Your account is pending admin approval. You will be able to log in once it is approved.",
      });
    }

    // Generate JWT token
    const token = generateToken(delivery._id.toString(), "Delivery");

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: delivery._id,
          name: delivery.name,
          mobile: delivery.mobile,
          email: delivery.email,
          userType: "Delivery",
          city: delivery.city,
          status: delivery.status,
        },
      },
    });
  },
);

/**
 * Register new delivery partner
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    mobile,
    email,
    dateOfBirth,
    password,
    address,
    city,
    pincode,
    drivingLicense,
    nationalIdentityCard,
    accountName,
    bankName,
    accountNumber,
    ifscCode,
    bonusType,
  } = req.body;

  // Validation
  if (!name || !mobile || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Name, mobile, email, and password are required",
    });
  }

  if (!/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({
      success: false,
      message: "Valid 10-digit mobile number is required",
    });
  }

  // Check if delivery partner already exists
  const existingDelivery = await Delivery.findOne({
    $or: [{ mobile }, { email }],
  });

  if (existingDelivery) {
    return res.status(409).json({
      success: false,
      message: "Delivery partner already exists with this mobile or email",
    });
  }

  // Create new delivery partner (with duplicate key handling)
  try {
    await Delivery.create({
      name,
      mobile,
      email,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      password,
      address,
      city,
      pincode,
      drivingLicense,
      nationalIdentityCard,
      accountName,
      bankName,
      accountNumber,
      ifscCode,
      bonusType,
      status: "Inactive",
      balance: 0,
      cashCollected: 0,
    } as any);
  } catch (createErr: any) {
    if (createErr.code === 11000) {
      return res.status(409).json({ success: false, message: "Delivery partner already exists with this mobile or email" });
    }
    throw createErr;
  }

  // Generate token (Optional: usually registration doesn't login immediately if approval needed, but for seamless UX we can)
  // However, FE Flow: Register -> OTP -> Login. So we return success, then FE calls sendSmsOtp.

  // Notify all admins: new delivery boy pending approval
  // Use socket emit (popup) + persisted bell for each admin.
  try {
    const { getIO } = await import("../../../socket/socketService");
    let io: any = null;
    try { io = getIO(); } catch { /* socket not yet running in tests */ }

    const title = "🚚 New Delivery Boy Registration";
    const message = `${name} (${mobile}) has registered and is awaiting approval.`;
    const admins = await Admin.find({}).select("_id").lean();

    for (const admin of admins) {
      await sendNotification("Admin", admin._id.toString(), title, message, {
        type: "System",
        priority: "High",
        link: "/admin/delivery-boy/manage",
      });
    }

    // Also emit popup event directly to admin-notifications room
    if (io) {
      io.to("admin-notifications").emit("new-delivery-registration", {
        title,
        message,
        name,
        mobile,
        link: "/admin/delivery-boy/manage",
        timestamp: new Date(),
      });
    }
  } catch (notifyErr) {
    // Non-fatal: registration still succeeds even if notification fails
    console.error("Failed to notify admin of delivery registration:", notifyErr);
  }

  return res.status(201).json({
    success: true,
    message: "Delivery partner registered successfully.",
  });
});

/**
 * Get current delivery partner profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  // @ts-ignore - req.user is added by middleware
  const userId = (req.user as any).userId;

  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "User not authenticated" });
  }

  const delivery = await Delivery.findById(userId).select("-password");

  if (!delivery) {
    return res.status(404).json({
      success: false,
      message: "Delivery partner not found",
    });
  }

  const totalDeliveredCount = await Order.countDocuments({
    deliveryBoy: userId,
    status: "Delivered",
  });

  return res.status(200).json({
    success: true,
    data: {
      ...delivery.toObject(),
      totalDeliveredCount,
    },
  });
});
