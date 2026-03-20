import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GlobalBackButton from "./GlobalBackButton";

interface PublicRouteProps {
    children?: React.ReactNode;
    userType?: 'Admin' | 'Seller' | 'Customer' | 'Delivery' | 'Warehouse';
}

export default function PublicRoute({ children, userType: allowedUserType }: PublicRouteProps) {
    const { isAuthenticated, user } = useAuth();

    if (isAuthenticated && user) {
        // Redirect authenticated users to their respective dashboards
        const currentUserType = (user as any).userType || (user as any).role;

        // If an allowedUserType is specified (e.g., 'Seller' for SellerLogin),
        // ONLY redirect if the logged-in user matches that type.
        // This allows a logged-in 'Customer' to see or access the login page for another type.
        if (allowedUserType && currentUserType !== allowedUserType) {
            return children ? <>{children}</> : <Outlet />;
        }

        if (currentUserType === 'Admin' || currentUserType === 'Super Admin') {
            return <Navigate to="/admin" replace />;
        }

        if (currentUserType === 'Seller') {
            return <Navigate to="/seller" replace />;
        }

        if (currentUserType === 'Delivery') {
            return <Navigate to="/delivery" replace />;
        }

        if (currentUserType === 'Warehouse') {
            return <Navigate to="/warehouse" replace />;
        }

        // Default for Customer
        return <Navigate to="/" replace />;
    }

    return (
        <>
            <GlobalBackButton
                fallbackPath="/"
                topOffsetClass="top-4 md:top-5"
                zIndexClass="z-40"
                theme="light"
            />
            {children ? <>{children}</> : <Outlet />}
        </>
    );
}
