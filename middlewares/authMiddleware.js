import AppError from "../utils/errorUtil.js";
import jwt from "jsonwebtoken";
import User from "../models/userSchema.js";

const isLoggedIn = async (req, res, next) => {
    let token;

    // Check Authorization header
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    // Fallback to cookie
    if (!token && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return next(new AppError('You are not logged in', 401));
    }

    try {
        const userDetails = jwt.verify(token, process.env.JWT_SECRET);
        req.user = userDetails;
        next();
    } catch (error) {
        return next(new AppError('Invalid or expired token', 401));
    }
};

const authorizedRoles = (...roles) => (req, res, next) => {
    const currentUserRole = req.user.role;
    if (!roles.includes(currentUserRole)) {
        return next(new AppError('You are not authorized to access this route', 403));
    }
    next();
}

const authorizedSubscribers = async (req, res, next) => {

    const user = await User.findById(req.user.id);

    if (user.role !== 'ADMIN' && user.subscription.status !== 'active') {
        return next(new AppError('Please subscribe to access this route', 403));
    }
    next();
};

export {
    isLoggedIn,
    authorizedRoles,
    authorizedSubscribers
};