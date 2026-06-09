import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export type AdminRole = 'Super Admin' | 'Admin' | 'Investor' | 'Staff';

export const ADMIN_MODULES = [
  'dashboard',
  'products',
  'orders',
  'customers',
  'delivery',
  'warehouse',
  'port',
  'finance',
  'marketing',
  'returns',
  'notifications',
  'settings',
] as const;

export type AdminModule = typeof ADMIN_MODULES[number];

export interface IAdmin extends Document {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  role: AdminRole;
  password: string;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  // RBAC — only used when role is 'Staff'
  viewModules: AdminModule[];
  writeModules: AdminModule[];
  createdAt: Date;
  updatedAt: Date;
  // FCM Push Notification Tokens
  fcmTokens?: string[];
  fcmTokenMobile?: string[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AdminSchema = new Schema<IAdmin>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
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
      validate: {
        validator: function (v: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please enter a valid email address',
      },
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: ['Super Admin', 'Admin', 'Investor', 'Staff'],
      default: 'Admin',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    viewModules: {
      type: [String],
      default: [],
    },
    writeModules: {
      type: [String],
      default: [],
    },
    password: {
      type: String,
      required: false,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    // FCM Push Notification Tokens
    fcmTokens: {
      type: [String],
      default: []
    },
    fcmTokenMobile: {
      type: [String],
      default: []
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
AdminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
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

// Method to compare password
AdminSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const Admin = (mongoose.models.Admin as mongoose.Model<IAdmin>) || mongoose.model<IAdmin>('Admin', AdminSchema);

export default Admin;

