import mongoose, { Document, Schema } from 'mongoose';

export interface IRetailerUser extends Document {
    ownerName: string;
    ownerPhone: string;
    shopName: string;
    shopPhone: string;
    address: string;
    googleMapLink: string;
    deliveryTime: string;
    paymentMode: string;
    highValueProducts: string[];
    inorRepresentative: string;
    profileImage?: string;
    documents: string[]; // URLs of uploaded files
    status: 'Pending' | 'Active' | 'Inactive';
    createdAt: Date;
    walletAmount: number;
    totalOrders: number;
    totalSpent: number;
    refCode?: string;
    deliveryOtp?: string;
    fcmTokens?: string[];
    fcmTokenMobile?: string[];
}

const RetailerUserSchema: Schema = new Schema(
    {
        ownerName: { type: String, required: true },
        ownerPhone: { type: String, required: true, unique: true },
        shopName: { type: String, required: true },
        shopPhone: { type: String, required: true },
        address: { type: String, required: true },
        googleMapLink: { type: String, required: true },
        deliveryTime: { type: String, required: true },
        paymentMode: { type: String, required: true },
        highValueProducts: [{ type: String }],
        inorRepresentative: { type: String },
        profileImage: { type: String },
        documents: [{ type: String }],
        status: { type: String, enum: ['Pending', 'Active', 'Inactive'], default: 'Pending' },
        walletAmount: { type: Number, default: 0 },
        totalOrders: { type: Number, default: 0 },
        totalSpent: { type: Number, default: 0 },
        refCode: { type: String },
        fcmTokenMobile: { type: [String], default: [] },
    },
    { timestamps: true }
);

// Generate deliveryOtp and refCode before saving if not provided
RetailerUserSchema.pre('save', async function (next) {
    if (!(this as any).deliveryOtp) {
        (this as any).deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
    }
    if (!(this as any).refCode) {
        const namePart = (this as any).shopName
          ? (this as any).shopName.replace(/\s+/g, '').substring(0, 4).toUpperCase()
          : 'RETA';
        const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
        (this as any).refCode = `${namePart}${randomPart}`;
    }
    next();
});

export default mongoose.models.RetailerUser || mongoose.model<IRetailerUser>('RetailerUser', RetailerUserSchema, 'retailer_users');
