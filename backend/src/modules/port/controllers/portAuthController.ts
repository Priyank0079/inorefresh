import { Request, Response } from "express";
import PortUser from "../../../models/PortUser";
import {
  sendOTP as sendOTPService,
  verifyOTP as verifyOTPService,
} from "../../../services/otpService";
import { generateToken } from "../../../services/jwtService";
import { asyncHandler } from "../../../utils/asyncHandler";

/**
 * Send OTP to port manager mobile number
 */
export const sendOTP = asyncHandler(async (req: Request, res: Response) => {
  const { mobile } = req.body;
  console.log(`[PORT DEBUG] sendOTP Hit for mobile: ${mobile}`);

  if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({
      success: false,
      message: "Valid 10-digit mobile number is required",
    });
  }

  // Check if port user exists with this mobile
  const portUser = await PortUser.findOne({ mobile });
  if (!portUser) {
    return res.status(404).json({
      success: false,
      message: "Port user not found with this mobile number. Please register first.",
    });
  }

  // Auto-approve existing pending users on login attempt
  if (portUser.status === 'PENDING') {
    portUser.status = 'ACTIVE';
    await portUser.save();
    console.log(`[PORT DEBUG] Auto-approved pending user: ${mobile}`);
  }


  if (portUser.status === 'REJECTED' || portUser.status === 'BLOCKED') {
    return res.status(403).json({
      success: false,
      message: `Your account is ${portUser.status.toLowerCase()}. Access denied.`,
    });
  }

  // Send OTP
  const result = await sendOTPService(mobile, "Port", true);

  return res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * Verify OTP and login port manager
 */
export const verifyOTP = asyncHandler(async (req: Request, res: Response) => {
  const { mobile, otp } = req.body;
  console.log(`[PORT AUTH DEBUG] verifyOTP Request: mobile=${mobile}, otp=${otp}`);

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
  const isValid = await verifyOTPService(mobile, otp, "Port");
  if (!isValid) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired OTP",
    });
  }

  // Find port user
  const portUser = await PortUser.findOne({ mobile });
  if (!portUser) {
    return res.status(404).json({
      success: false,
      message: "Port user not found",
    });
  }

  // Generate JWT token
  const token = generateToken(portUser._id.toString(), "Port", "port_manager");

  return res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      token,
      user: {
        id: portUser._id,
        portName: portUser.portName,
        managerName: portUser.managerName,
        mobile: portUser.mobile,
        email: portUser.email,
        profileImage: portUser.profileImage,
        userType: "Port",
        status: portUser.status
      },
    },
  });
});

/**
 * Register new port manager
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { portName, managerName, mobile, email, location, licenseNumber } = req.body;

  // Validation
  if (!portName || !managerName || !mobile || !email || !location || !licenseNumber) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  if (!/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({
      success: false,
      message: "Valid 10-digit mobile number is required",
    });
  }

  // Check if port user already exists
  const existingUser = await PortUser.findOne({
    $or: [{ mobile }, { email }],
  });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "A port partner already exists with this mobile or email",
    });
  }

  // Create new port user
  // Create new port user - Auto-approve for seamless onboarding
  const portUser = await PortUser.create({
    portName,
    managerName,
    mobile,
    email,
    location,
    licenseNumber,
    status: 'ACTIVE'
  });

  // Generate JWT token for immediate login
  const token = generateToken(portUser._id.toString(), "Port", "port_manager");

  return res.status(201).json({
    success: true,
    message: "Registration successful",
    data: {
      token,
      user: {
        id: portUser._id,
        portName: portUser.portName,
        managerName: portUser.managerName,
        mobile: portUser.mobile,
        email: portUser.email,
        status: portUser.status,
        userType: "Port",
        profileImage: portUser.profileImage
      }
    },
  });
});

/**
 * Get port manager profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const portUser = await PortUser.findById(req.user.userId);
  if (!portUser) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  return res.status(200).json({
    success: true,
    data: portUser
  });
});

/**
 * Update port manager profile
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { portName, managerName, email, location, licenseNumber, profileImage } = req.body;

  try {
    const portUser = await PortUser.findById(req.user.userId);
    
    if (!portUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update fields
    if (portName !== undefined) portUser.portName = portName;
    if (managerName !== undefined) portUser.managerName = managerName;
    if (email !== undefined) portUser.email = email;
    if (location !== undefined) portUser.location = location;
    if (licenseNumber !== undefined) portUser.licenseNumber = licenseNumber;
    if (profileImage !== undefined) portUser.profileImage = profileImage;

    const updatedUser = await portUser.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser
    });
  } catch (error: any) {
    console.error("[PORT PROFILE ERROR] updateProfile failed:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update profile",
      errors: error.errors
    });
  }
});
