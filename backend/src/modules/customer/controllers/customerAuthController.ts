import { Request, Response } from "express";
import Customer from "../../../models/Customer";
import {
  sendSmsOtp as sendSmsOtpService,
  verifySmsOtp as verifySmsOtpService,
} from "../../../services/otpService";
import { generateToken } from "../../../services/jwtService";
import { asyncHandler } from "../../../utils/asyncHandler";
import Admin from "../../../models/Admin";
import { sendNotification } from "../../../services/notificationService";

/**
 * Send SMS OTP to customer mobile number
 * Returns session_id for verification
 */
export const sendSmsOtp = asyncHandler(async (req: Request, res: Response) => {
  const { mobile } = req.body;

  if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({
      success: false,
      message: "Valid 10-digit mobile number is required",
    });
  }

  // Send SMS OTP - no need to check if customer exists
  // New customers will be auto-created upon OTP verification
  const result = await sendSmsOtpService(mobile, "Customer");

  return res.status(200).json({
    success: true,
    message: result.message,
    sessionId: result.sessionId,
  });
});

/**
 * Verify SMS OTP and login customer
 * Requires session_id and otp
 * Auto-creates customer if not exists
 */
export const verifySmsOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const { mobile, otp, sessionId, referralCode } = req.body;

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
        message: "Session ID is required for verification",
      });
    }

    // Verify SMS OTP
    const isValid = await verifySmsOtpService(
      sessionId,
      otp,
      mobile,
      "Customer",
    );
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Find or create customer (atomic — handles concurrent registrations)
    let customer = await Customer.findOne({ phone: mobile });
    let isNewUser = false;

    if (!customer) {
      try {
        customer = await Customer.create({
          phone: mobile,
          name: "User",
          email: `${mobile}@dhakadsnazzy.temp`,
          status: "Active",
          walletAmount: 0,
          totalOrders: 0,
          totalSpent: 0,
        });
        isNewUser = true;
      } catch (createErr: any) {
        if (createErr.code === 11000) {
          customer = await Customer.findOne({ phone: mobile });
          if (!customer) {
            return res.status(500).json({ success: false, message: "Registration failed. Please try again." });
          }
        } else {
          throw createErr;
        }
      }

      // Notify all admins: new customer registered (DB persist + live socket
      // popup + push, matching the delivery-boy registration pattern so the
      // alert actually shows up in real time, not just on next refresh).
      try {
        const { getIO } = await import("../../../socket/socketService");
        let io: any = null;
        try {
          io = getIO();
        } catch {
          /* socket not yet running in tests */
        }

        const title = "🧑 New Customer Registration";
        const message = `New customer with phone ${mobile} has registered.`;
        const admins = await Admin.find({}).select("_id").lean();

        for (const admin of admins) {
          await sendNotification("Admin", admin._id.toString(), title, message, {
            type: "System",
            priority: "Medium",
            link: "/admin/customers",
          });
        }

        if (io) {
          io.to("admin-notifications").emit("new-customer-registration", {
            title,
            message,
            phone: mobile,
            link: "/admin/customers",
            timestamp: new Date(),
          });
        }
      } catch (notifyErr) {
        console.error("Failed to notify admin of customer registration:", notifyErr);
      }

      // Process Signup Rewards (1000 bonus + referral check)
      const { processSignupRewards } = require("../../../services/rewardService");
      await processSignupRewards(customer._id.toString(), "Customer", referralCode);
    }

    // Generate JWT token
    const token = generateToken(customer._id.toString(), "Customer");

    return res.status(200).json({
      success: true,
      message: isNewUser
        ? "Account created and login successful"
        : "Login successful",
      data: {
        token,
        user: {
          id: customer._id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          walletAmount: customer.walletAmount,
          refCode: customer.refCode,
          status: customer.status,
          userType: "Customer",
        },
        isNewUser,
      },
    });
  },
);
