import mongoose, { Document, Schema } from 'mongoose';

export interface IHorecaUser extends Document {
    shopName: string;
    address: string;
    googleMapLink: string;
    deliveryTime: string;
    paymentMode: string;
    highValueProducts: string[];
    inorRepresentative: string;
    shopPhone: string;
    ownerName: string;
    ownerPhone: string;
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

const HorecaUserSchema: Schema = new Schema(
    {
        shopName: { type: String, required: true },
        address: { type: String, required: true },
        googleMapLink: { type: String, required: true },
        deliveryTime: { type: String, required: true },
        paymentMode: { type: String, required: true },
        highValueProducts: [{ type: String }],
        inorRepresentative: { type: String },
        shopPhone: { type: String, required: true },
        ownerName: { type: String, required: true },
        ownerPhone: { type: String, required: true, unique: true },
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
HorecaUserSchema.pre('save', async function (next) {
    if (!(this as any).deliveryOtp) {
        (this as any).deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
    }
    if (!(this as any).refCode) {
        const namePart = (this as any).shopName
          ? (this as any).shopName.replace(/\s+/g, '').substring(0, 4).toUpperCase()
          : 'HORE';
        const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
        (this as any).refCode = `${namePart}${randomPart}`;
    }
    next();
});

export default mongoose.models.HorecaUser || mongoose.model<IHorecaUser>('HorecaUser', HorecaUserSchema, 'horeca_users');
