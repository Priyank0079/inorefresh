import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import Product from "../../../models/Product";
import OrderItem from "../../../models/OrderItem";
import InwardStock from "../../../models/InwardStock";

/**
 * GET /warehouse/stock-overview
 * Comprehensive stock dashboard: per-product stock, sold, returned, low-stock alerts.
 */
export const getStockOverview = asyncHandler(
  async (req: Request, res: Response) => {
    const warehouseId = req.user?.userId;

    // All products for this warehouse
    const products = await Product.find({ warehouse: warehouseId })
      .select("productName productImage stock price discPrice weight sku status variations category")
      .populate("category", "name")
      .sort({ productName: 1 })
      .lean();

    // If warehouse has no products, try ALL products (single warehouse model)
    let allProducts = products;
    if (products.length === 0) {
      allProducts = await Product.find()
        .select("productName productImage stock price discPrice weight sku status variations category warehouse")
        .populate("category", "name")
        .sort({ productName: 1 })
        .lean();
    }

    const productIds = allProducts.map((p) => p._id);

    // Total sold per product (from OrderItems)
    const soldAgg = await OrderItem.aggregate([
      { $match: { product: { $in: productIds } } },
      { $group: { _id: "$product", totalSold: { $sum: "$quantity" }, totalRevenue: { $sum: "$total" } } },
    ]);
    const soldMap = new Map(soldAgg.map((s) => [String(s._id), { sold: s.totalSold, revenue: s.totalRevenue }]));

    // Inward stock per product
    const inwardAgg = await InwardStock.aggregate([
      { $match: { product: { $in: productIds }, status: { $in: ["Received", "Active", "approved"] } } },
      { $group: { _id: "$product", totalInward: { $sum: "$quantity" } } },
    ]);
    const inwardMap = new Map(inwardAgg.map((i) => [String(i._id), i.totalInward]));

    // Build product stock list
    const LOW_STOCK_THRESHOLD = 10;
    const stockList = allProducts.map((p: any) => {
      const sold = soldMap.get(String(p._id)) || { sold: 0, revenue: 0 };
      const inward = inwardMap.get(String(p._id)) || 0;
      const currentStock = p.stock || 0;
      const isLowStock = currentStock <= LOW_STOCK_THRESHOLD && currentStock > 0;
      const isOutOfStock = currentStock === 0;

      return {
        _id: p._id,
        productName: p.productName,
        image: p.productImage?.[0] || null,
        category: (p.category as any)?.name || "Uncategorized",
        sku: p.sku || "",
        price: p.price,
        discPrice: p.discPrice || 0,
        weight: p.weight || 0,
        status: p.status,
        currentStock,
        totalInward: inward,
        totalSold: sold.sold,
        totalRevenue: sold.revenue,
        isLowStock,
        isOutOfStock,
        reorderSuggested: isLowStock || isOutOfStock,
      };
    });

    // Summary
    const summary = {
      totalProducts: stockList.length,
      activeProducts: stockList.filter((p) => p.status === "Active").length,
      totalStockUnits: stockList.reduce((s, p) => s + p.currentStock, 0),
      totalSoldUnits: stockList.reduce((s, p) => s + p.totalSold, 0),
      totalRevenue: stockList.reduce((s, p) => s + p.totalRevenue, 0),
      lowStockCount: stockList.filter((p) => p.isLowStock).length,
      outOfStockCount: stockList.filter((p) => p.isOutOfStock).length,
      needsReorder: stockList.filter((p) => p.reorderSuggested).length,
    };

    res.json({
      success: true,
      data: {
        summary,
        products: stockList,
        lowStockProducts: stockList.filter((p) => p.isLowStock),
        outOfStockProducts: stockList.filter((p) => p.isOutOfStock),
      },
    });
  },
);
