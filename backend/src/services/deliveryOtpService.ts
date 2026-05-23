import Order from '../models/Order';
import Customer from '../models/Customer';
import HorecaUser from '../models/HorecaUser';
import RetailerUser from '../models/RetailerUser';

/**
 * Generate a dynamic delivery OTP for a specific order.
 * This is triggered when the rider clicks "Get OTP" at the customer's location.
 */
export async function generateDeliveryOtp(orderId: string): Promise<{ success: boolean; message: string }> {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'Delivered') {
      throw new Error('Order is already delivered');
    }

    // Generate dynamic 4-digit OTP
    const dynamicOtp = Math.floor(1000 + Math.random() * 9000).toString();
    order.deliveryOtp = dynamicOtp;
    await order.save();

    // Send notification to customer with the OTP
    const { sendNotification } = require('./notificationService');
    await sendNotification(
      "Customer",
      order.customer.toString(),
      "Delivery Verification OTP",
      `Your delivery OTP for Order #${order.orderNumber} is ${dynamicOtp}. Please share this with the delivery partner to begin the quality check.`,
      { type: "Order", priority: "High", link: `/orders/${order._id}` }
    );

    return {
      success: true,
      message: 'OTP generated and sent to customer successfully.',
    };
  } catch (error: any) {
    console.error('Error in generateDeliveryOtp:', error);
    throw new Error(error.message || 'Failed to process delivery OTP request');
  }
}

/**
 * Global helper to get or create a permanent delivery OTP for any user type
 */
export async function getOrCreateDeliveryOtp(userId: string): Promise<string | null> {
  let buyer: any = await Customer.findById(userId) || 
                   await HorecaUser.findById(userId) || 
                   await RetailerUser.findById(userId);

  if (!buyer) return null;

  if (!buyer.deliveryOtp) {
    console.log(`[Delivery OTP] Generating missing delivery OTP on-the-fly for user ${userId}`);
    buyer.deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
    await buyer.save();
  }

  return buyer.deliveryOtp;
}

/**
 * Verify delivery OTP using customer's permanent OTP
 */
export async function verifyDeliveryOtp(orderId: string, otp: string): Promise<{ success: boolean; message: string }> {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    // 1. Status Check - Ensure order is in a state where delivery can be completed
    const allowedStatuses = ['Shipped', 'Picked up', 'On the way', 'Out for Delivery'];
    if (!allowedStatuses.includes(order.status)) {
      throw new Error(`Delivery verification is only allowed when order is Out for Delivery. Current status: ${order.status}`);
    }

    // 2. Determine the valid OTP
    // Valid OTP must be generated dynamically and stored on the order
    let validOtp = order.deliveryOtp;
    
    if (!validOtp || !validOtp.trim()) {
      throw new Error('Delivery OTP not generated for this order yet. Please tap "Get OTP".');
    }

    // Fetch dynamic duration settings
    let duration = 10;
    try {
      const AppSettings = require('../models/AppSettings').default;
      const settings = await AppSettings.getSettings();
      duration = settings?.inspectionDurationMinutes || 10;
    } catch (e) {
      console.error("Failed to load inspection duration settings:", e);
    }

    // Developer bypass for testing
    if ((process.env.NODE_ENV !== 'production' || process.env.USE_MOCK_OTP === 'true') && otp === '9999') {
      order.deliveryOtpVerified = true;
      order.status = 'Delivered';
      order.deliveredAt = new Date();
      order.invoiceEnabled = true;
      
      // Verification Countdown Settings
      order.inspectionStartedAt = new Date();
      order.inspectionExpiresAt = new Date(Date.now() + duration * 60000);
      order.inspectionDurationMinutes = duration;
      order.riderStatusDuringInspection = "WAITING_FOR_CUSTOMER_VERIFICATION";
      order.isVerifiedByCustomer = false;
      
      await order.save();

      return {
        success: true,
        message: 'OTP verified successfully. Order marked as delivered.',
      };
    }

    // Verify OTP against valid OTP (robust string comparison)
    if (String(validOtp).trim() !== String(otp).trim()) {
      throw new Error('Invalid OTP. Please check the code provided by the customer.');
    }

    // Mark order as delivered
    order.deliveryOtpVerified = true;
    order.status = 'Delivered';
    order.deliveredAt = new Date();
    order.invoiceEnabled = true;
    
    // Verification Countdown Settings
    order.inspectionStartedAt = new Date();
    order.inspectionExpiresAt = new Date(Date.now() + duration * 60000);
    order.inspectionDurationMinutes = duration;
    order.riderStatusDuringInspection = "WAITING_FOR_CUSTOMER_VERIFICATION";
    order.isVerifiedByCustomer = false;
    
    await order.save();

    return {
      success: true,
      message: 'OTP verified successfully. Order marked as delivered.',
    };
  } catch (error: any) {
    console.error('Error verifying delivery OTP:', error);
    throw new Error(error.message || 'Failed to verify delivery OTP');
  }
}
