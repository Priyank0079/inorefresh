import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../services/jwtService';

export type AuthUserType = 'Admin' | 'Warehouse' | 'Customer' | 'Delivery' | 'horeca' | 'retailer' | 'Port';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Authenticate user by verifying JWT token
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log(`[AUTH DEBUG] 401 Unauthorized: No token provided for ${req.method} ${req.originalUrl}`);
      res.status(401).json({
        success: false,
        message: 'No token provided. Authorization header must be in format: Bearer <token>',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      next();
    } catch (error: any) {
      console.log(`[AUTH DEBUG] 401 Unauthorized: Invalid token for ${req.method} ${req.originalUrl} - ${error.message}`);
      res.status(401).json({
        success: false,
        message: error.message || 'Invalid or expired token',
      });
      return;
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message,
    });
    return;
  }
};

/**
 * Authorize user by checking role (for Admin users)
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!req.user.role || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions. Required role: ' + roles.join(' or '),
      });
      return;
    }

    next();
  };
};

/**
 * Require specific user type(s)
 */
export const requireUserType = (...userTypes: AuthUserType[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    let currentUserType = req.user.userType;

    // Fallback for legacy tokens that might not have userType.
    // Default to 'Customer' since all customer-facing routes use this middleware
    // and older tokens (issued before userType was added) belong to customers.
    if (!currentUserType) {
      currentUserType = 'Customer' as any;
    }

    if (!userTypes.includes(currentUserType as any)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Required user type: ' + userTypes.join(' or '),
      });
      return;
    }

    next();
  };
};

/**
 * Require authenticated admin user.
 * Kept as a dedicated middleware for admin-only endpoints that need explicit intent.
 */
export const requireAdminAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  if (req.user.userType !== "Admin") {
    res.status(403).json({
      success: false,
      message: "Access denied. Admin access required.",
    });
    return;
  }

  next();
};

/** Only the main Admin role can call team management endpoints */
export const requireAdminRole = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const role = req.user?.role;
  if (role !== "Admin" && role !== "Super Admin") {
    res.status(403).json({
      success: false,
      message: "Access denied. Only Admin can manage the team.",
    });
    return;
  }
  next();
};

/** Block Investor from any mutation. For Staff, caller must additionally check module. */
export const requireAdminWrite = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const role = req.user?.role;
  if (role === "Investor") {
    res.status(403).json({
      success: false,
      message: "Read-only access. Investors cannot modify data.",
    });
    return;
  }
  next();
};

/** Block Investor AND Staff-without-write-permission from a specific module's mutations */
export const requireWriteModule = (module: string) => (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const role = req.user?.role;
  if (!role || role === "Investor") {
    res.status(403).json({
      success: false,
      message: "Read-only access.",
    });
    return;
  }
  if (role === "Staff") {
    const writeModules: string[] = req.user?.writeModules ?? [];
    if (!writeModules.includes(module)) {
      res.status(403).json({
        success: false,
        message: `No write permission for module: ${module}`,
      });
      return;
    }
  }
  next();
};

/** Block Staff from viewing a module they have no view access to */
export const requireViewModule = (module: string) => (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const role = req.user?.role;
  // Admin, Super Admin, Investor: full view
  if (!role || role !== "Staff") {
    next();
    return;
  }
  const viewModules: string[] = req.user?.viewModules ?? [];
  if (!viewModules.includes(module)) {
    res.status(403).json({
      success: false,
      message: `No view permission for module: ${module}`,
    });
    return;
  }
  next();
};
