import { Request, Response } from "express";
import { PortProduct } from "../../../models";
import { asyncHandler } from "../../../utils/asyncHandler";
import mongoose from "mongoose";

/**
 * Get all products for the logged-in port user
 */
export const getMyProducts = asyncHandler(async (req: Request, res: Response) => {
  const portId = (req as any).user.userId || (req as any).user.id || (req as any).user._id;

  const products = await PortProduct.find({ portId }).sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: products,
  });
});

/**
 * Create a new product for the port
 */
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const portId = (req as any).user.userId || (req as any).user.id || (req as any).user._id;
  const {
    productName,
    category,
    fishType,
    sizeWeightClass,
    qualityGrade,
    availableQuantity,
    pricePerKg,
    availabilityDate,
    description,
    image,
  } = req.body;

  const product = await PortProduct.create({
    portId: new mongoose.Types.ObjectId(portId),
    productName,
    category,
    fishType,
    sizeWeightClass,
    qualityGrade,
    availableQuantity,
    pricePerKg,
    availabilityDate: new Date(availabilityDate),
    description,
    image,
  });

  return res.status(201).json({
    success: true,
    message: "Product added successfully",
    data: product,
  });
});

/**
 * Get product by ID
 */
export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const portId = (req as any).user.userId || (req as any).user.id || (req as any).user._id;

  const product = await PortProduct.findOne({ _id: id, portId });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: product,
  });
});

/**
 * Update product
 */
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const portId = (req as any).user.userId || (req as any).user.id || (req as any).user._id;
  
  const updatedProduct = await PortProduct.findOneAndUpdate(
    { _id: id, portId },
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!updatedProduct) {
    return res.status(404).json({
      success: false,
      message: "Product not found or not authorized",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: updatedProduct,
  });
});

/**
 * Delete product
 */
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const portId = (req as any).user.userId || (req as any).user.id || (req as any).user._id;

  const result = await PortProduct.findOneAndDelete({ _id: id, portId });

  if (!result) {
    return res.status(404).json({
      success: false,
      message: "Product not found or not authorized",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

/**
 * Get all port products (for Explore option in Admin and Warehouse)
 */
export const exploreProducts = asyncHandler(async (_req: Request, res: Response) => {
  const products = await PortProduct.find({ status: 'Active' })
    .populate('portId', 'portName location managerName mobile email')
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: products,
  });
});
