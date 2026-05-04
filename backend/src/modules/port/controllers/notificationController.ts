import { Request, Response } from "express";
import Notification from "../../../models/Notification";
import { asyncHandler } from "../../../utils/asyncHandler";

/**
 * Get all notifications for the logged-in port user
 */
export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const portId = (req as any).user.userId || (req as any).user.id || (req as any).user._id;

  const notifications = await Notification.find({
    $or: [
      { recipientType: "Port", recipientId: portId },
      { recipientType: "All" }
    ]
  }).sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: notifications,
  });
});

/**
 * Mark a notification as read
 */
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const portId = (req as any).user.userId || (req as any).user.id || (req as any).user._id;

  const notification = await Notification.findOneAndUpdate(
    { _id: id, $or: [{ recipientId: portId }, { recipientType: "All" }] },
    { isRead: true, readAt: new Date() },
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
    message: "Notification marked as read",
    data: notification,
  });
});

/**
 * Mark all notifications as read for the logged-in port user
 */
export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const portId = (req as any).user.userId || (req as any).user.id || (req as any).user._id;

  await Notification.updateMany(
    { 
      $or: [
        { recipientType: "Port", recipientId: portId },
        { recipientType: "All" }
      ],
      isRead: false 
    },
    { isRead: true, readAt: new Date() }
  );

  return res.status(200).json({
    success: true,
    message: "All notifications marked as read",
  });
});

/**
 * Delete a notification
 */
export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const portId = (req as any).user.userId || (req as any).user.id || (req as any).user._id;

  const result = await Notification.findOneAndDelete({
    _id: id,
    $or: [{ recipientId: portId }, { recipientType: "All" }]
  });

  if (!result) {
    return res.status(404).json({
      success: false,
      message: "Notification not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Notification deleted successfully",
  });
});
