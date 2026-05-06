import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import Notification from "../../../models/Notification";

const getCustomerUserId = (req: Request) => (req as any).user?.userId;

/**
 * Get all notifications for the logged-in customer-like user
 */
export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const customerId = getCustomerUserId(req);

  const notifications = await Notification.find({
    $and: [
      { recipientType: { $in: ["Customer", "All"] } },
      {
        $or: [
          { recipientId: customerId },
          { recipientType: "All" },
        ],
      },
      {
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gte: new Date() } },
        ],
      },
    ],
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
  const customerId = getCustomerUserId(req);

  const notification = await Notification.findOneAndUpdate(
    {
      _id: id,
      $and: [
        { recipientType: { $in: ["Customer", "All"] } },
        {
          $or: [
            { recipientId: customerId },
            { recipientType: "All" },
          ],
        },
      ],
    },
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
 * Mark all notifications as read
 */
export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const customerId = getCustomerUserId(req);

  await Notification.updateMany(
    {
      $and: [
        { recipientType: { $in: ["Customer", "All"] } },
        {
          $or: [
            { recipientId: customerId },
            { recipientType: "All" },
          ],
        },
        { isRead: false },
      ],
    },
    { isRead: true, readAt: new Date() }
  );

  return res.status(200).json({
    success: true,
    message: "All notifications marked as read",
  });
});
