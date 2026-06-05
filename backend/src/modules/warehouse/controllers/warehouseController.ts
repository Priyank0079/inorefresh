import { Request, Response } from "express";
import Warehouse from "../../../models/Warehouse";
import { asyncHandler } from "../../../utils/asyncHandler";

/**
 * Get all Warehouses (Admin only)
 */
export const getAllWarehouses = asyncHandler(
  async (req: Request, res: Response) => {
    const { status, search } = req.query;

    // Build query
    const query: any = {};
    // Exclude system-generated fallback/dummy warehouse from admin list views.
    query.email = { $ne: "admin-warehouse@zetomart.com" };
    query.$nor = [
      { warehouseName: { $regex: /^Warehouse W\d+$/i } },
      { managerName: { $regex: /^Manager W\d+$/i } },
      { email: { $regex: /^manager@w\d+\.com$/i } },
      { mobile: { $regex: /^999999990\d$/ } },
      { address: { $regex: /Hub Address,\s*City/i } },
    ];
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { warehouseName: { $regex: search, $options: "i" } },
        { storeName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }

    const warehouses = await Warehouse.find(query)
      .select("-password") // Exclude password
      .sort({ createdAt: -1 })
      .lean(); // Sort by newest first

    const InwardStock = require("../../../models/InwardStock").default || require("../../../models/InwardStock");
    
    const warehouseIds = warehouses.map(w => w._id);
    const stockAggregations = await InwardStock.aggregate([
      { $match: { warehouse: { $in: warehouseIds } } },
      { $group: { _id: "$warehouse", totalQuantity: { $sum: "$quantity" } } }
    ]);

    const stockMap = new Map();
    stockAggregations.forEach((agg: any) => {
      stockMap.set(agg._id.toString(), agg.totalQuantity);
    });

    const warehousesWithStock = warehouses.map(w => ({
      ...w,
      inwardStockSummary: {
        totalQuantity: stockMap.get(w._id.toString()) || 0
      }
    }));

    return res.status(200).json({
      success: true,
      message: "Warehouses fetched successfully",
      data: warehousesWithStock,
    });
  }
);

/**
 * Get Warehouse by ID
 */
export const getWarehouseById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const warehouse = await Warehouse.findById(id).select("-password");

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Warehouse fetched successfully",
      data: warehouse,
    });
  }
);

/**
 * Update Warehouse status (Approve/Reject)
 */
export const updateWarehouseStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["Approved", "Pending", "Rejected", "ACTIVE", "BLOCKED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status is required (Approved, Pending, Rejected, ACTIVE, or BLOCKED)",
      });
    }

    const warehouse = await Warehouse.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).select("-password");

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Warehouse status updated to ${status}`,
      data: warehouse,
    });
  }
);

/**
 * Update Warehouse details
 */
export const updateWarehouse = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { password, latitude, longitude, serviceRadiusKm, ...rest } = req.body;

    // Handle location update (convert lat/lng to GeoJSON)
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        (rest as any).location = { type: "Point", coordinates: [lng, lat] };
        (rest as any).latitude = lat.toString();
        (rest as any).longitude = lng.toString();
      }
    }

    // Handle serviceRadiusKm update
    if (serviceRadiusKm !== undefined && serviceRadiusKm !== null && serviceRadiusKm !== "") {
      const radius = typeof serviceRadiusKm === "string" ? parseFloat(serviceRadiusKm) : Number(serviceRadiusKm);
      if (!isNaN(radius) && radius >= 0.1 && radius <= 100) {
        (rest as any).serviceRadiusKm = radius;
      } else {
        return res.status(400).json({ success: false, message: "Service radius must be between 0.1 and 100 kilometers" });
      }
    }

    // If a new password is provided, use save() so the pre-save bcrypt hook fires
    if (password && typeof password === "string" && password.trim().length >= 6) {
      const warehouseDoc = await Warehouse.findById(id);
      if (!warehouseDoc) {
        return res.status(404).json({ success: false, message: "Warehouse not found" });
      }
      Object.assign(warehouseDoc, rest);
      warehouseDoc.password = password.trim();
      const saved = await warehouseDoc.save();
      const result = saved.toObject() as any;
      delete result.password;
      return res.status(200).json({ success: true, message: "Warehouse updated successfully", data: result });
    }

    // No password change — use findByIdAndUpdate (skips hash hook safely)
    const warehouse = await Warehouse.findByIdAndUpdate(id, rest, { new: true, runValidators: true }).select("-password");
    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }

    return res.status(200).json({ success: true, message: "Warehouse updated successfully", data: warehouse });
  }
);

/**
 * Delete Warehouse
 */
export const deleteWarehouse = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const warehouse = await Warehouse.findByIdAndDelete(id);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Warehouse deleted successfully",
    });
  }
);


