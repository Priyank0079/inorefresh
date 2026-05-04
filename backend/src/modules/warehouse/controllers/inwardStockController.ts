import { Request, Response } from "express";
import InwardStock from "../../../models/InwardStock";
import PortRequirement from "../../../models/PortRequirement";
import { asyncHandler } from "../../../utils/asyncHandler";

/**
 * Get all inward stock for a warehouse
 */
export const getInwardStocks = asyncHandler(async (req: Request, res: Response) => {
  const warehouseId = (req as any).user.userId;
  const { page = 1, limit = 10, search, status, dateFrom, dateTo } = req.query;

  const query: any = { warehouse: warehouseId };

  if (status && status !== 'All Status') {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { supplierName: { $regex: search, $options: 'i' } },
      { productName: { $regex: search, $options: 'i' } },
      { invoiceNumber: { $regex: search, $options: 'i' } },
    ];
  }

  if (dateFrom || dateTo) {
    query.date = {};
    if (dateFrom) {
      const start = new Date(dateFrom as string);
      start.setHours(0, 0, 0, 0);
      query.date.$gte = start;
    }
    if (dateTo) {
      const end = new Date(dateTo as string);
      end.setHours(23, 59, 59, 999);
      query.date.$lte = end;
    }
  }

  const skip = (Number(page) - 1) * Number(limit);
  const stocks = await InwardStock.find(query)
    .sort({ date: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await InwardStock.countDocuments(query);

  return res.status(200).json({
    success: true,
    data: stocks,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * Get single inward stock by ID
 */
export const getInwardStockById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const stock = await InwardStock.findById(id);

  if (!stock) {
    return res.status(404).json({
      success: false,
      message: "Inward stock record not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: stock,
  });
});

/**
 * Add new inward stock
 */
export const addInwardStock = asyncHandler(async (req: Request, res: Response) => {
  const warehouseId = (req as any).user.userId;
  
  // Auto-generate Requirement ID
  const requirementId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;

  const stockData = {
    ...req.body,
    warehouse: warehouseId,
    invoiceNumber: requirementId // Use auto-generated ID as invoice number if not provided
  };

  console.log("DEBUG: stockData to create:", JSON.stringify(stockData, null, 2));
  console.log("DEBUG: InwardStock schema paths:", Object.keys(InwardStock.schema.paths));


  let newStock;
  try {
    newStock = await InwardStock.create(stockData);
    console.log("DEBUG: InwardStock created successfully");

  } catch (err: any) {
    console.error("Error creating InwardStock:", err);
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to create inward stock record",
      errors: err.errors // Send Mongoose validation errors
    });
  }

  // Also create a PortRequirement
  try {
    const requirement = await PortRequirement.create({
      requirementId: requirementId,
      fishName: req.body.productName,
      category: req.body.category || 'Fresh',
      grade: req.body.variant,
      quantityRequired: req.body.quantity,
      unit: req.body.unit || 'kg',
      // targetPrice removed as per user request
      deadline: req.body.deliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'Open',
      warehouseId: warehouseId,
      priority: 'medium',
      notes: req.body.remarks
    });

    // Emit socket notification to Port
    const io = req.app.get("io");
    if (io) {
      io.to('port-notifications').emit('new-requirement', {
        message: `New requirement for ${req.body.productName} from Warehouse`,
        requirement: requirement
      });
    }
  } catch (err) {
    console.error("Error creating PortRequirement:", err);
  }

  return res.status(201).json({
    success: true,
    message: "Inward stock added successfully",
    data: newStock,
  });

});



/**
 * Update inward stock status
 */
export const updateInwardStockStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const updatedStock = await InwardStock.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  if (!updatedStock) {
    return res.status(404).json({
      success: false,
      message: "Inward stock record not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Inward stock status updated successfully",
    data: updatedStock,
  });
});

/**
 * Update inward stock record (full)
 */
export const updateInwardStock = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  const updatedStock = await InwardStock.findByIdAndUpdate(
    id,
    updateData,
    { new: true }
  );

  if (!updatedStock) {
    return res.status(404).json({
      success: false,
      message: "Inward stock record not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Inward stock record updated successfully",
    data: updatedStock,
  });
});

/**
 * Delete inward stock record
 */
export const deleteInwardStock = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const deletedStock = await InwardStock.findByIdAndDelete(id);

  if (!deletedStock) {
    return res.status(404).json({
      success: false,
      message: "Inward stock record not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Inward stock record deleted successfully",
  });
});
