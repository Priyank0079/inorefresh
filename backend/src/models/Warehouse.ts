import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IWarehouse extends Document {
    warehouseName: string;
    managerName: string;
    mobile: string;
    email: string;
    password?: string;
    address: string;
    location: {
        type: {
            type: string;
            enum: ["Point"];
            default: "Point";
        };
        coordinates: [number, number]; // [longitude, latitude]
    };
    status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
    role: 'warehouse';
    createdBy: 'ADMIN';
    balance: number;
    serviceRadiusKm?: number;
    commission?: number;
    commissionRate?: number;
    fcmTokens?: string[];
    fcmTokenMobile?: string[];
    // Store details / branding
    storeName?: string;
    category?: string;
    city?: string;
    storeDescription?: string;
    profile?: string;
    logo?: string;
    storeBanner?: string;
    // Bank details
    accountName?: string;
    bankName?: string;
    branch?: string;
    accountNumber?: string;
    ifsc?: string;
    // Tax details
    panCard?: string;
    taxName?: string;
    taxNumber?: string;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const WarehouseSchema = new Schema<IWarehouse>(
    {
        warehouseName: {
            type: String,
            required: [true, 'Warehouse name is required'],
            trim: true,
        },
        managerName: {
            type: String,
            required: [true, 'Manager name is required'],
            trim: true,
        },
        mobile: {
            type: String,
            required: [true, 'Mobile number is required'],
            unique: true,
            trim: true,
            validate: {
                validator: function (v: string) {
                    return /^[0-9]{10}$/.test(v);
                },
                message: 'Mobile number must be 10 digits',
            },
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: false,
            select: false,
        },
        address: {
            type: String,
            required: [true, 'Address is required'],
            trim: true,
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: true,
            },
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'],
            default: 'ACTIVE',
        },
        role: {
            type: String,
            default: 'warehouse',
        },
        createdBy: {
            type: String,
            default: 'ADMIN',
        },
        balance: {
            type: Number,
            default: 0,
        },
        serviceRadiusKm: {
            type: Number,
            default: 10,
            min: [0.1, 'Service radius must be at least 0.1 km'],
            max: [100, 'Service radius cannot exceed 100 km'],
        },
        commission: {
            type: Number,
            min: [0, 'Commission cannot be negative'],
        },
        commissionRate: {
            type: Number,
            min: [0, 'Commission rate cannot be negative'],
        },
        fcmTokens: {
            type: [String],
            default: [],
        },
        fcmTokenMobile: {
            type: [String],
            default: [],
        },
        // Store details / branding
        storeName: { type: String, trim: true },
        category: { type: String, trim: true },
        city: { type: String, trim: true },
        storeDescription: { type: String, trim: true },
        profile: { type: String, trim: true },
        logo: { type: String, trim: true },
        storeBanner: { type: String, trim: true },
        // Bank details
        accountName: { type: String, trim: true },
        bankName: { type: String, trim: true },
        branch: { type: String, trim: true },
        accountNumber: { type: String, trim: true },
        ifsc: { type: String, trim: true, uppercase: true },
        // Tax details
        panCard: { type: String, trim: true, uppercase: true },
        taxName: { type: String, trim: true },
        taxNumber: { type: String, trim: true, uppercase: true },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
WarehouseSchema.pre('save', async function (this: IWarehouse, next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

WarehouseSchema.methods.comparePassword = async function (
    this: IWarehouse,
    candidatePassword: string
): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

// 2dsphere index for location queries
WarehouseSchema.index({ location: '2dsphere' });
// Index for status filtering (used in findSellersWithinRange)
WarehouseSchema.index({ status: 1 });

const Warehouse = (mongoose.models.Warehouse as mongoose.Model<IWarehouse>) || mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);

// Register Alias for refPath 'WAREHOUSE' (consistent with the ref naming)
if (!(mongoose.models.WAREHOUSE as mongoose.Model<IWarehouse>)) {
    mongoose.model<IWarehouse>('WAREHOUSE', WarehouseSchema, 'warehouses');
}

export default Warehouse;
