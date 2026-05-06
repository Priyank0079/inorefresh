import Notification from "../models/Notification";
import Admin from "../models/Admin";
import Warehouse from "../models/Warehouse";
import Customer from "../models/Customer";
import HorecaUser from "../models/HorecaUser";
import RetailerUser from "../models/RetailerUser";
import Delivery from "../models/Delivery";
import PortUser from "../models/PortUser";
import { getIO } from "../socket/socketService";

const getNotificationRoom = (recipientType: string, recipientId?: string) => {
  if (recipientType === "Admin") return "admin-notifications";
  if (recipientType === "Warehouse") return recipientId ? `warehouse-${recipientId}` : "warehouse-notifications";
  if (recipientType === "Port") return recipientId ? `port-${recipientId}` : "port-notifications";
  if (recipientType === "Delivery") return recipientId ? `delivery-${recipientId}` : "delivery-notifications";
  if (recipientType === "Customer") return recipientId ? `customer-${recipientId}` : "customer-notifications";
  return recipientId ? `${recipientType.toLowerCase()}-${recipientId}` : `${recipientType.toLowerCase()}-notifications`;
};

/**
 * Send notification to specific user
 */
export const sendNotification = async (
  recipientType: "Admin" | "Warehouse" | "Customer" | "Delivery" | "Port",
  recipientId: string,
  title: string,
  message: string,
  options?: {
    type?:
    | "Info"
    | "Success"
    | "Warning"
    | "Error"
    | "Order"
    | "Payment"
    | "System";
    link?: string;
    actionLabel?: string;
    priority?: "Low" | "Medium" | "High" | "Urgent";
    expiresAt?: Date;
  },
) => {
  const notificationData: any = {
    recipientType,
    title,
    message,
    type: options?.type || "Info",
    link: options?.link,
    actionLabel: options?.actionLabel,
    priority: options?.priority || "Medium",
    expiresAt: options?.expiresAt,
    isRead: false,
  };

  if (recipientId) {
    notificationData.recipientId = recipientId;
  }

  const notification = await Notification.create(notificationData);

  // Emit real-time notification via socket
  try {
    const io = getIO();
    const room = getNotificationRoom(recipientType, recipientId);
    io.to(room).emit("new-notification", notification);
  } catch (error) {
    console.error("Socket emission failed for notification:", error);
  }

  return notification;
};

/**
 * Send notification to all users of a type
 */
export const sendBroadcastNotification = async (
  recipientType: "Admin" | "Warehouse" | "Customer" | "Delivery" | "Port",
  title: string,
  message: string,
  options?: {
    type?:
    | "Info"
    | "Success"
    | "Warning"
    | "Error"
    | "Order"
    | "Payment"
    | "System";
    link?: string;
    actionLabel?: string;
    priority?: "Low" | "Medium" | "High" | "Urgent";
    expiresAt?: Date;
  },
) => {
  // Get all users of the specified type
  let userIds: string[] = [];

  switch (recipientType) {
    case "Admin":
      const admins = await Admin.find().select("_id");
      userIds = admins.map((a) => a._id.toString());
      break;
    case "Warehouse":
      const warehouses = await Warehouse.find().select("_id");
      userIds = warehouses.map((w) => w._id.toString());
      break;
    case "Customer":
      const customers = await Customer.find().select("_id");
      const horecaUsers = await HorecaUser.find().select("_id");
      const retailerUsers = await RetailerUser.find().select("_id");
      userIds = [
        ...customers.map((c) => c._id.toString()),
        ...horecaUsers.map((c) => c._id.toString()),
        ...retailerUsers.map((c) => c._id.toString()),
      ];
      break;
    case "Delivery":
      const deliveries = await Delivery.find().select("_id");
      userIds = deliveries.map((d) => d._id.toString());
      break;
    case "Port":
      const ports = await PortUser.find().select("_id");
      userIds = ports.map((p) => p._id.toString());
      break;
  }

  // Create notifications for all users
  const notifications = await Promise.all(
    userIds.map(async (userId) => {
      const notification = await Notification.create({
        recipientType,
        recipientId: userId,
        title,
        message,
        type: options?.type || "Info",
        link: options?.link,
        actionLabel: options?.actionLabel,
        priority: options?.priority || "Medium",
        expiresAt: options?.expiresAt,
        isRead: false,
      });

      // Emit real-time notification via socket
      try {
        const io = getIO();
        const room = getNotificationRoom(recipientType, userId);
        io.to(room).emit("new-notification", notification);
      } catch (error) {
        console.error("Socket emission failed for broadcast notification:", error);
      }

      return notification;
    })
  );

  return notifications;
};

/**
 * Send order status notification
 */
export const sendOrderStatusNotification = async (
  orderId: string,
  customerId: string,
  status: string,
) => {
  const statusMessages: Record<string, { title: string; message: string }> = {
    Processed: {
      title: "Order Processed",
      message:
        "Your order has been processed and is being prepared for shipment.",
    },
    Shipped: {
      title: "Order Shipped",
      message: "Your order has been shipped and is on its way!",
    },
    "Out for Delivery": {
      title: "Out for Delivery",
      message: "Your order is out for delivery and will reach you soon.",
    },
    Delivered: {
      title: "Order Delivered",
      message:
        "Your order has been delivered successfully. Thank you for shopping with us!",
    },
    Cancelled: {
      title: "Order Cancelled",
      message:
        "Your order has been cancelled. If you have any questions, please contact support.",
    },
  };

  const statusInfo = statusMessages[status];
  if (!statusInfo) return;

  return sendNotification(
    "Customer",
    customerId,
    statusInfo.title,
    statusInfo.message,
    {
      type: "Order",
      link: `/orders/${orderId}`,
      priority: status === "Cancelled" ? "High" : "Medium",
    },
  );
};

/**
 * Send product approval notification
 */
export const sendProductApprovalNotification = async (
  warehouseId: string,
  productId: string,
  status: "Approved" | "Rejected",
  rejectionReason?: string,
) => {
  const title = status === "Approved" ? "Product Approved" : "Product Rejected";
  const message =
    status === "Approved"
      ? "Your product has been approved and is now live on the platform."
      : `Your product has been rejected. Reason: ${rejectionReason || "Not specified"
      }`;

  return sendNotification("Warehouse", warehouseId, title, message, {
    type: status === "Approved" ? "Success" : "Error",
    link: `/products/${productId}`,
    priority: "Medium",
  });
};

/**
 * Send port offer related notifications
 */
export const sendPortOfferNotification = async (
  recipientType: "Admin" | "Warehouse" | "Port",
  recipientId: string,
  title: string,
  message: string,
  options?: any
) => {
  return sendNotification(recipientType as any, recipientId, title, message, {
    type: "Order",
    ...options
  });
};
