import { Request, Response } from "express";
import Order from "../../../models/Order";
import Product from "../../../models/Product";
// import Category from "../../../models/Category";
// import Category from "../../../models/Category";
import OrderItem from "../../../models/OrderItem";
import { asyncHandler } from "../../../utils/asyncHandler";
import mongoose from "mongoose";

/**
 * Get Warehouse's dashboard statistics
 */
export const getDashboardStats = asyncHandler(
    async (req: Request, res: Response) => {
        const WarehouseId = new mongoose.Types.ObjectId((req as any).user.userId);

        // Find orders associated with this Warehouse
        // Since Order model doesn't have WarehouseId, we find orders via OrderItem
        const WarehouseOrderItems = await OrderItem.find({ warehouse: WarehouseId }).select('order');
        const WarehouseOrderIds = [...new Set(WarehouseOrderItems.map(item => item.order.toString()))];

        // 1. KPI Metrics
        const [
            totalOrders,
            completedOrders,
            pendingOrders,
            cancelledOrders,
            totalProduct,
            totalCategoryCount,
            totalSubcategoryCount,
            totalCustomerCount,
        ] = await Promise.all([
            Order.countDocuments({ _id: { $in: WarehouseOrderIds } }),
            Order.countDocuments({ _id: { $in: WarehouseOrderIds }, status: "Delivered" }),
            Order.countDocuments({ _id: { $in: WarehouseOrderIds }, status: "Pending" }),
            Order.countDocuments({ _id: { $in: WarehouseOrderIds }, status: "Cancelled" }),
            Product.countDocuments({ warehouse: WarehouseId }), // Fix uppercase W
            Product.distinct("category", { warehouse: WarehouseId }).then(ids => ids.length),
            Product.distinct("subcategory", { warehouse: WarehouseId }).then(ids => ids.length),
            Order.distinct("customer", { _id: { $in: WarehouseOrderIds } }).then(ids => ids.length),
        ]);

        // 2. Alert Metrics (Low Stock < 5)
        const products = await Product.find({ warehouse: WarehouseId });
        let soldOutProducts = 0;
        let lowStockProducts = 0;

        products.forEach(product => {
            let isSoldOut = true;
            let isLowStock = false;

            if (product.variations && product.variations.length > 0) {
                product.variations.forEach((v: any) => {
                    if ((v.stock || 0) > 0) isSoldOut = false;
                    if ((v.stock || 0) > 0 && (v.stock || 0) < 5) isLowStock = true;
                    if (v.stock && v.stock > 0) isSoldOut = false;
                    if (v.stock && v.stock > 0 && v.stock < 5) isLowStock = true;
                });
            } else {
                // Handle products without variations (fallback)
                if (product.stock > 0) isSoldOut = false;
                if (product.stock > 0 && product.stock < 5) isLowStock = true;
            }

            if (isSoldOut) soldOutProducts++;
            else if (isLowStock) lowStockProducts++;
        });

        // 3. New Orders Table (Latest 10)
        const newOrders = await Order.find({ _id: { $in: WarehouseOrderIds } })
            .sort({ createdAt: -1 })
            .limit(10);

        const formattedNewOrders = newOrders.map(order => ({
            id: order.orderNumber || order._id.toString(), // Use orderNumber if available
            orderDate: new Date(order.orderDate).toLocaleDateString('en-GB'),
            status: order.status === 'Out for Delivery' ? 'Out For Delivery' : order.status,
            amount: order.total, // Use total instead of grandTotal (check Schema)
        }));

        // 4. Chart Data (Last 12 months)
        const currentYear = new Date().getFullYear();
        const monthlyStats = await Order.aggregate([
            {
                $match: {
                    _id: { $in: WarehouseOrderIds.map(id => new mongoose.Types.ObjectId(id)) },
                    orderDate: {
                        $gte: new Date(`${currentYear}-01-01`),
                        $lte: new Date(`${currentYear}-12-31`)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$orderDate" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const yearlyOrderData = months.map((month, index) => {
            const monthStat = monthlyStats.find(s => s._id === index + 1);
            return { date: month, value: monthStat ? monthStat.count : 0 };
        });

        // 5. Daily Chart Data (Current Month)
        const currentMonth = new Date().getMonth();
        const dailyStats = await Order.aggregate([
            {
                $match: {
                    _id: { $in: WarehouseOrderIds.map(id => new mongoose.Types.ObjectId(id)) },
                    orderDate: {
                        $gte: new Date(currentYear, currentMonth, 1),
                        $lte: new Date(currentYear, currentMonth + 1, 0)
                    }
                }
            },
            {
                $group: {
                    _id: { $dayOfMonth: "$orderDate" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const dailyOrderData = Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dayStat = dailyStats.find(s => s._id === day);
            return { date: day.toString(), value: dayStat ? dayStat.count : 0 };
        });

        return res.status(200).json({
            success: true,
            message: "Dashboard stats fetched successfully",
            data: {
                stats: {
                    totalUser: totalCustomerCount,
                    totalCategory: totalCategoryCount,
                    totalSubcategory: totalSubcategoryCount,
                    totalProduct,
                    totalOrders,
                    completedOrders,
                    pendingOrders,
                    cancelledOrders,
                    soldOutProducts,
                    lowStockProducts,
                    yearlyOrderData,
                    dailyOrderData
                },
                newOrders: formattedNewOrders
            }
        });
    }
);
