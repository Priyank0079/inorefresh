import { Request, Response } from "express";
import Admin, { ADMIN_MODULES, AdminModule } from "../../../models/Admin";
import { asyncHandler } from "../../../utils/asyncHandler";

function sanitizeTeamMember(admin: any) {
  return {
    id: admin._id,
    firstName: admin.firstName,
    lastName: admin.lastName,
    email: admin.email,
    mobile: admin.mobile,
    role: admin.role,
    isActive: admin.isActive,
    viewModules: admin.viewModules ?? [],
    writeModules: admin.writeModules ?? [],
    createdBy: admin.createdBy,
    createdAt: admin.createdAt,
  };
}

/** GET /admin/team — list all Investor + Staff members */
export const getTeamMembers = asyncHandler(async (_req: Request, res: Response) => {
  const members = await Admin.find({
    role: { $in: ["Investor", "Staff"] },
  }).select("-password").sort({ createdAt: -1 });

  return res.json({
    success: true,
    data: members.map(sanitizeTeamMember),
  });
});

/** POST /admin/team — create Investor or Staff */
export const createTeamMember = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, mobile, email, role, viewModules, writeModules } = req.body;

  if (!firstName || !lastName || !mobile || !email || !role) {
    return res.status(400).json({
      success: false,
      message: "firstName, lastName, mobile, email and role are required",
    });
  }

  if (!["Investor", "Staff"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Role must be Investor or Staff",
    });
  }

  if (!/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({
      success: false,
      message: "Valid 10-digit mobile number is required",
    });
  }

  const existing = await Admin.findOne({ $or: [{ mobile }, { email }] });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: "A user with this mobile or email already exists",
    });
  }

  // Validate modules when role is Staff
  let safeViewModules: AdminModule[] = [];
  let safeWriteModules: AdminModule[] = [];

  if (role === "Staff") {
    safeViewModules = (viewModules ?? []).filter((m: string) =>
      ADMIN_MODULES.includes(m as AdminModule)
    );
    safeWriteModules = (writeModules ?? []).filter((m: string) =>
      safeViewModules.includes(m as AdminModule)
    );
  }

  const member = await Admin.create({
    firstName,
    lastName,
    mobile,
    email,
    role,
    isActive: true,
    createdBy: req.user?.userId,
    viewModules: safeViewModules,
    writeModules: safeWriteModules,
  });

  return res.status(201).json({
    success: true,
    message: `${role} member created successfully`,
    data: sanitizeTeamMember(member),
  });
});

/** PUT /admin/team/:id — update basic info */
export const updateTeamMember = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { firstName, lastName, email, mobile } = req.body;

  const member = await Admin.findOne({ _id: id, role: { $in: ["Investor", "Staff"] } });
  if (!member) {
    return res.status(404).json({ success: false, message: "Team member not found" });
  }

  if (firstName) member.firstName = firstName;
  if (lastName) member.lastName = lastName;
  if (email) member.email = email;
  if (mobile) {
    if (!/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({ success: false, message: "Invalid mobile number" });
    }
    member.mobile = mobile;
  }

  await member.save();

  return res.json({
    success: true,
    message: "Team member updated",
    data: sanitizeTeamMember(member),
  });
});

/** PATCH /admin/team/:id/permissions — update Staff module permissions */
export const updatePermissions = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { viewModules, writeModules } = req.body;

  const member = await Admin.findOne({ _id: id, role: "Staff" });
  if (!member) {
    return res.status(404).json({ success: false, message: "Staff member not found" });
  }

  const safeViewModules: AdminModule[] = (viewModules ?? []).filter((m: string) =>
    ADMIN_MODULES.includes(m as AdminModule)
  );
  // writeModules must be a subset of viewModules
  const safeWriteModules: AdminModule[] = (writeModules ?? []).filter((m: string) =>
    safeViewModules.includes(m as AdminModule)
  );

  member.viewModules = safeViewModules;
  member.writeModules = safeWriteModules;
  await member.save();

  return res.json({
    success: true,
    message: "Permissions updated",
    data: sanitizeTeamMember(member),
  });
});

/** PATCH /admin/team/:id/status — activate / deactivate */
export const toggleStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const member = await Admin.findOne({ _id: id, role: { $in: ["Investor", "Staff"] } });
  if (!member) {
    return res.status(404).json({ success: false, message: "Team member not found" });
  }

  member.isActive = !member.isActive;
  await member.save();

  return res.json({
    success: true,
    message: `Member ${member.isActive ? "activated" : "deactivated"}`,
    data: sanitizeTeamMember(member),
  });
});

/** DELETE /admin/team/:id — remove member */
export const deleteTeamMember = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const member = await Admin.findOneAndDelete({ _id: id, role: { $in: ["Investor", "Staff"] } });
  if (!member) {
    return res.status(404).json({ success: false, message: "Team member not found" });
  }

  return res.json({ success: true, message: "Team member removed" });
});
