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
    documents: string[]; // URLs of uploaded files
    status: 'Pending' | 'Active' | 'Inactive';
    createdAt: Date;
    walletAmount: number;
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
        inorRepresentative: { type: String, required: true },
        shopPhone: { type: String, required: true },
        ownerName: { type: String, required: true },
        ownerPhone: { type: String, required: true, unique: true },
        documents: [{ type: String }],
        status: { type: String, enum: ['Pending', 'Active', 'Inactive'], default: 'Pending' },
        walletAmount: { type: Number, default: 0 },
        refCode: { type: String },
        deliveryOtp: { type: String, trim: true },
        fcmTokens: { type: [String], default: [] },
        fcmTokenMobile: { type: [String], default: [] },
    },
    { timestamps: true }
);

// Generate deliveryOtp before saving if not provided
HorecaUserSchema.pre('save', async function (next) {
    if (!(this as any).deliveryOtp) {
        (this as any).deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
    }
    next();
});

export default mongoose.models.HorecaUser || mongoose.model<IHorecaUser>('HorecaUser', HorecaUserSchema, 'horeca_users');
