import { Request, Response } from "express";
import Admin from "../../../models/Admin";
import {
  sendOTP as sendOTPService,
  verifyOTP as verifyOTPService,
} from "../../../services/otpService";
import { generateToken } from "../../../services/jwtService";
import { asyncHandler } from "../../../utils/asyncHandler";

function buildUserPayload(admin: any) {
  return {
    id: admin._id,
    firstName: admin.firstName,
    lastName: admin.lastName,
    mobile: admin.mobile,
    email: admin.email,
    role: admin.role,
    isActive: admin.isActive,
    viewModules: admin.viewModules ?? [],
    writeModules: admin.writeModules ?? [],
    userType: "Admin",
  };
}

export const sendOTP = asyncHandler(async (req: Request, res: Response) => {
  const { mobile } = req.body;

  if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({
      success: false,
      message: "Valid 10-digit mobile number is required",
    });
  }

  const admin = await Admin.findOne({ mobile });
  if (!admin) {
    return res.status(404).json({
      success: false,
      message: "Admin not found with this mobile number",
    });
  }

  if (!admin.isActive) {
    return res.status(403).json({
      success: false,
      message: "Your account has been deactivated. Contact the admin.",
    });
  }

  const result = await sendOTPService(mobile, "Admin", true);

  return res.status(200).json({
    success: true,
    message: result.message,
  });
});

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

  const isValid = await verifyOTPService(mobile, otp, "Admin");
  if (!isValid) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired OTP",
    });
  }

  const admin = await Admin.findOne({ mobile }).select("-password");
  if (!admin) {
    return res.status(404).json({
      success: false,
      message: "Admin not found",
    });
  }

  if (!admin.isActive) {
    return res.status(403).json({
      success: false,
      message: "Your account has been deactivated. Contact the admin.",
    });
  }

  const token = generateToken(
    admin._id.toString(),
    "Admin",
    admin.role,
    admin.viewModules,
    admin.writeModules,
  );

  return res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      token,
      user: buildUserPayload(admin),
    },
  });
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, mobile, email, password, role } = req.body;

  if (!firstName || !lastName || !mobile || !email || !password) {
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

  const existingAdmin = await Admin.findOne({
    $or: [{ mobile }, { email }],
  });

  if (existingAdmin) {
    return res.status(409).json({
      success: false,
      message: "Admin already exists with this mobile or email",
    });
  }

  const admin = await Admin.create({
    firstName,
    lastName,
    mobile,
    email,
    password,
    role: role || "Admin",
  });

  const token = generateToken(admin._id.toString(), "Admin", admin.role);

  return res.status(201).json({
    success: true,
    message: "Admin registered successfully",
    data: {
      token,
      user: buildUserPayload(admin),
    },
  });
});
