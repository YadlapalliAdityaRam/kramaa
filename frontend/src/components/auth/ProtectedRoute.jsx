import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoaderOverlay from '../common/LoaderOverlay';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, isAuthenticated, isLoading } = useSelector((state) => state.auth);
    const normalizedRole = String(user?.role || '').toUpperCase();
    const normalizedAllowedRoles = Array.isArray(allowedRoles)
        ? allowedRoles.map((role) => String(role || '').toUpperCase())
        : null;

    if (isLoading) {
        return <LoaderOverlay visible message="Verifying session" />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (normalizedAllowedRoles && !normalizedAllowedRoles.includes(normalizedRole)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
