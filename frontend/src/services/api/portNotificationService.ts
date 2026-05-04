import api from "./config";

export interface PortNotification {
  _id: string;
  title: string;
  message: string;
  type: "Info" | "Success" | "Warning" | "Error" | "Order" | "Payment" | "System";
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export const getMyNotifications = async () => {
  const response = await api.get("/port/notifications");
  return response.data;
};

export const markAsRead = async (id: string) => {
  const response = await api.patch(`/port/notifications/${id}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await api.patch("/port/notifications/mark-all-read");
  return response.data;
};

export const deleteNotification = async (id: string) => {
  const response = await api.delete(`/port/notifications/${id}`);
  return response.data;
};
