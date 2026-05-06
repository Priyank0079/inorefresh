import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import Notification from "../../../models/Notification";

/**
 * Get all notifications for the logged-in warehouse
 */
export const getMyNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    
    const notifications = await Notification.find({
      recipientType: "Warehouse",
      recipientId: userId,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gte: new Date() } },
      ],
    })
    .sort({ createdAt: -1 })
    .limit(50);

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  }
);

/**
 * Mark notification as read
 */
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipientId: userId },
    {
      isRead: true,
      readAt: new Date(),
    },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: "Notification not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: notification,
  });
});

/**
 * Mark all notifications as read
 */
export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  await Notification.updateMany(
    { recipientId: userId, isRead: false },
    {
      isRead: true,
      readAt: new Date(),
    }
  );

  return res.status(200).json({
    success: true,
    message: "All notifications marked as read",
  });
});
