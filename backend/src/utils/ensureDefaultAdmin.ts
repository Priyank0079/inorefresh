import Admin from '../models/Admin';

const DEFAULT_ADMIN_MOBILE = process.env.DEFAULT_ADMIN_MOBILE || '9876543210';
const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'admin@dhakadsnazzy.com';
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';
const DEFAULT_ADMIN_FIRST = process.env.DEFAULT_ADMIN_FIRST || 'Default';
const DEFAULT_ADMIN_LAST = process.env.DEFAULT_ADMIN_LAST || 'Admin';
const DEFAULT_ADMIN_ROLE = (process.env.DEFAULT_ADMIN_ROLE as 'Super Admin' | 'Admin') || 'Super Admin';

/**
 * Ensure a default admin user exists for quick access to the admin panel.
 * Mobile: from DEFAULT_ADMIN_MOBILE
 * Email: from DEFAULT_ADMIN_EMAIL
 */
export async function ensureDefaultAdmin() {
  // 1) If admin already exists with target mobile, use it
  const existingByMobile = await Admin.findOne({ mobile: DEFAULT_ADMIN_MOBILE });
  if (existingByMobile) {
    console.log(`Default admin already exists (mobile: ${existingByMobile.mobile})`);
    return existingByMobile;
  }

  // 2) If default email exists on a different mobile, update it to configured mobile
  const existingByEmail = await Admin.findOne({ email: DEFAULT_ADMIN_EMAIL });
  if (existingByEmail) {
    const mobileInUse = await Admin.findOne({
      mobile: DEFAULT_ADMIN_MOBILE,
      _id: { $ne: existingByEmail._id },
    });

    if (!mobileInUse) {
      existingByEmail.mobile = DEFAULT_ADMIN_MOBILE;
      await existingByEmail.save();
      console.log(`Default admin mobile updated to ${existingByEmail.mobile}`);
      return existingByEmail;
    }

    console.warn(
      `Default admin email exists but mobile ${DEFAULT_ADMIN_MOBILE} is already used by another admin. Keeping existing admin mobile: ${existingByEmail.mobile}`
    );
    return existingByEmail;
  }

  // 3) Create default admin if none exists
  const admin = await Admin.create({
    firstName: DEFAULT_ADMIN_FIRST,
    lastName: DEFAULT_ADMIN_LAST,
    mobile: DEFAULT_ADMIN_MOBILE,
    email: DEFAULT_ADMIN_EMAIL,
    role: DEFAULT_ADMIN_ROLE,
    password: DEFAULT_ADMIN_PASSWORD,
  });

  console.log(`Default admin created (mobile: ${admin.mobile}, role: ${admin.role})`);
  return admin;
}

export default ensureDefaultAdmin;
