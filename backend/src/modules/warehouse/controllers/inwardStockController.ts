import { Request, Response } from "express";
import InwardStock from "../../../models/InwardStock";
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

  res.status(200).json({
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

  res.status(200).json({
    success: true,
    data: stock,
  });
});

/**
 * Add new inward stock
 */
export const addInwardStock = asyncHandler(async (req: Request, res: Response) => {
  const warehouseId = (req as any).user.userId;
  const stockData = {
    ...req.body,
    warehouse: warehouseId,
  };

  const newStock = await InwardStock.create(stockData);

  res.status(201).json({
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

  res.status(200).json({
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

  res.status(200).json({
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

  res.status(200).json({
    success: true,
    message: "Inward stock record deleted successfully",
  });
});
