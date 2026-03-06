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

    const Warehouses = await Warehouse.find(query)
      .select("-password") // Exclude password
      .sort({ createdAt: -1 }); // Sort by newest first

    return res.status(200).json({
      success: true,
      message: "Warehouses fetched successfully",
      data: Warehouses,
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
    const updateData = req.body;

    // Remove password from update data if present
    delete updateData.password;

    // Handle location update (convert lat/lng to GeoJSON)
    if (updateData.latitude && updateData.longitude) {
      const latitude = parseFloat(updateData.latitude);
      const longitude = parseFloat(updateData.longitude);

      if (!isNaN(latitude) && !isNaN(longitude)) {
        // Update GeoJSON location for geospatial queries
        updateData.location = {
          type: "Point",
          coordinates: [longitude, latitude], // MongoDB GeoJSON: [longitude, latitude]
        };
        // Ensure string fields are also synchronized
        updateData.latitude = latitude.toString();
        updateData.longitude = longitude.toString();
      }
    }

    // Handle serviceRadiusKm update
    if (
      updateData.serviceRadiusKm !== undefined &&
      updateData.serviceRadiusKm !== null &&
      updateData.serviceRadiusKm !== ""
    ) {
      const radius =
        typeof updateData.serviceRadiusKm === "string"
          ? parseFloat(updateData.serviceRadiusKm)
          : Number(updateData.serviceRadiusKm);

      if (!isNaN(radius) && radius >= 0.1 && radius <= 100) {
        updateData.serviceRadiusKm = radius; // Ensure it's saved as a number
      } else {
        return res.status(400).json({
          success: false,
          message: "Service radius must be between 0.1 and 100 kilometers",
        });
      }
    } else if (
      updateData.serviceRadiusKm === "" ||
      updateData.serviceRadiusKm === null
    ) {
      // If empty string or null is sent, remove it from updates to keep existing value
      delete updateData.serviceRadiusKm;
    }

    const warehouse = await Warehouse.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Warehouse updated successfully",
      data: warehouse,
    });
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


