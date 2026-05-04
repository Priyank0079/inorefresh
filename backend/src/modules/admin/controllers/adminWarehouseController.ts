import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import Warehouse from "../../../models/Warehouse";
import Notification from "../../../models/Notification";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeCoordinate = (value: unknown): number => {
    const parsed = typeof value === "number" ? value : parseFloat(String(value));
    return parsed;
};

/**
 * Create warehouse account (Admin only)
 */
export const createWarehouse = asyncHandler(async (req: Request, res: Response) => {
    const {
        warehouseName,
        managerName,
        mobile,
        email,
        address,
        latitude: lat,
        longitude: lng,
        status = "ACTIVE",
        password,
        storeName
    } = req.body || {};

    if (
        !warehouseName ||
        !managerName ||
        !mobile ||
        !email ||
        !address ||
        lat === undefined ||
        lng === undefined
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Required fields: warehouseName, managerName, mobile, email, address, latitude, longitude",
        });
    }

    if (!/^[0-9]{10}$/.test(String(mobile))) {
        return res.status(400).json({
            success: false,
            message: "Mobile must be a valid 10-digit number",
        });
    }

    if (!EMAIL_REGEX.test(String(email))) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid email address",
        });
    }

    const latitude = normalizeCoordinate(lat);
    const longitude = normalizeCoordinate(lng);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return res.status(400).json({
            success: false,
            message: "Location must include valid latitude and longitude",
        });
    }

    const existingWarehouse = await Warehouse.findOne({
        $or: [{ email: String(email).toLowerCase() }, { mobile: String(mobile) }],
    });

    if (existingWarehouse) {
        return res.status(409).json({
            success: false,
            message: "Warehouse already exists with this mobile or email",
        });
    }

    const warehouse = await Warehouse.create({
        warehouseName: String(warehouseName).trim(),
        managerName: String(managerName).trim(),
        mobile: String(mobile).trim(),
        email: String(email).trim().toLowerCase(),
        password: password || "Warehouse@123", // Default password if not provided
        storeName: storeName || String(warehouseName).trim(),
        address: String(address).trim(),
        location: {
            type: "Point",
            coordinates: [longitude, latitude],
        },
        status,
        role: "warehouse",
        createdBy: "ADMIN",
        balance: 0,
    });

    await Notification.create({
        recipientType: "Warehouse",
        recipientId: warehouse._id,
        title: "Warehouse Created",
        message: `Warehouse ${warehouseName} has been created. Manager: ${managerName}.`,
        type: "System",
        priority: "High",
        createdBy: req.user?.userId,
    });

    return res.status(201).json({
        success: true,
        message: "Warehouse created successfully",
        data: warehouse
    });
});

/**
 * Get all warehouses
 */
export const getAllWarehouses = asyncHandler(async (_req: Request, res: Response) => {
    const warehouses = await Warehouse.find({
        email: { $ne: "admin-warehouse@zetomart.com" },
        $nor: [
            { warehouseName: { $regex: /^Warehouse W\d+$/i } },
            { managerName: { $regex: /^Manager W\d+$/i } },
            { email: { $regex: /^manager@w\d+\.com$/i } },
            { mobile: { $regex: /^999999990\d$/ } },
            { address: { $regex: /Hub Address,\s*City/i } },
        ],
    })
        .sort({ warehouseName: 1 });

    return res.status(200).json({
        success: true,
        message: "Warehouses fetched successfully",
        data: warehouses,
    });
});

/**
 * Get inward stock summary for a warehouse (Admin only)
 */
export const getWarehouseInwardStockSummary = asyncHandler(async (req: Request, res: Response) => {
    const { warehouseId } = req.params;
    const { dateFrom, dateTo } = req.query;
    
    const InwardStock = require("../../../models/InwardStock").default || require("../../../models/InwardStock");
    
    const query: any = { warehouse: warehouseId };
    
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
    
    const stocks = await InwardStock.find(query).sort({ date: -1 });
    
    // Calculate summary
    const summary = {
        totalQuantity: stocks.reduce((sum: number, stock: any) => sum + (stock.quantity || 0), 0),
        totalRecords: stocks.length,
        byStatus: {
            received: stocks.filter((s: any) => s.status === 'Received').length,
            pending: stocks.filter((s: any) => s.status === 'Pending').length,
            cancelled: stocks.filter((s: any) => s.status === 'Cancelled').length,
        }
    };
    
    return res.status(200).json({
        success: true,
        message: "Warehouse inward stock summary fetched successfully",
        data: {
            stocks,
            summary
        }
    });
});

/**
 * Get inward stock for all warehouses with pagination (Admin only)
 */
export const getAllWarehousesInwardStock = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search, status, dateFrom, dateTo } = req.query;
    const InwardStock = require("../../../models/InwardStock").default || require("../../../models/InwardStock");
    
    const query: any = {};
    
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
        .populate('warehouse', 'warehouseName')
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit));
    
    const total = await InwardStock.countDocuments(query);
    
    return res.status(200).json({
        success: true,
        message: "Inward stock records fetched successfully",
        data: stocks,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
        }
    });
});
