import User from "../models/userSchema.js";
import AppError from "../utils/errorUtil.js";
import cloudinary from "cloudinary";
import fs from "fs";
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";

const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',  // HTTPS only in prod
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // None for prod (cross-site), lax for dev
};



const Register = async (req, res, next) => {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
        return next(new AppError('All fields are required', 400));
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        return next(new AppError('Email already exists', 400));
    }

    const user = await User.create({
        fullName,
        email,
        password,
        avatar: {
            public_id: email,
            secure_url: `https://cloudinary.com/dz4xj1q2b/image/upload/v1698851234/avatar.png`
        }
    });

    if (!user) {
        return next(new AppError('User registration failed', 500));
    }

    // File Upload

    if (req.file) {
        console.log(req.file);
        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'lms',
                width: 150,
                height: 150,
                gravity: 'face',
                crop: 'fill'
            });

            if (result) {
                user.avatar.public_id = result.public_id;
                user.avatar.secure_url = result.secure_url;

                // Remove the local file after upload
                fs.unlink(`uploads/${req.file.filename}`, (err) => {
                    if (err) console.error('Failed to delete local file:', err);
                });


            }
        } catch (error) {
            return next(new AppError('File upload failed', 500));
        }

        await user.save();

        // Convert Mongoose user to plain JS object
        const userData = user.toObject();

        userData.password = undefined; // Remove password from output

        const token = await user.generateJWTToken();

        res.cookie('token', token, cookieOptions);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: userData // send clean user data
        });

    }
};

const Login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new AppError('Email and password are required', 400));
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.comparePassword(password))) {
            return next(new AppError('Invalid email or password', 401));
        }

        const token = await user.generateJWTToken();
        user.password = undefined;

        res.cookie('token', token, cookieOptions);  // Set cookie with options

        res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            user,
        });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};

const Logout = (req, res) => {
    res.cookie('token', null, {
        ...cookieOptions,
        maxAge: 0,   // Clear cookie immediately
    });

    res.status(200).json({
        success: true,
        message: 'User logged out successfully',
    });
};

const getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        res.status(200).json({
            success: true,
            message: 'User profile fetched successfully',
            user
        });

    } catch (error) {
        return next(new AppError(error.message, 500));
    }


};

const forgotPassword = async (req, res, next) => {

    const { email } = req.body;

    if (!email) {
        return next(new AppError('Email is required', 400));
    }

    const user = await User.findOne({ email });
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    const resetToken = await user.generatePasswordResetToken();

    await user.save();

    const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const subject = 'Reset Password';
    const message = `You can reset your password by clicking <a href=${resetPasswordUrl} target="_blank">Reset your password</a>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordUrl}`;

    try {
        await sendEmail(email, subject, message);

        res.status(200).json({
            success: true,
            message: `Reset password token has been sent to ${email} successfully`
        });
    } catch (error) {

        user.forgotPasswordExpiry = undefined;
        user.forgotPasswordToken = undefined;
        await user.save();

        return next(new AppError(error.message, 500));
    }
};

const resetPassword = async (req, res, next) => {

    const { resetToken } = req.params;

    const { password } = req.body;

    const forgotPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
        forgotPasswordToken,
        forgotPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
        return next(new AppError('Token is invalid or expired, please try again', 400));
    }

    user.password = password;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    user.save();

    res.status(200).json({
        success: true,
        message: 'Password Changed Successfully'
    });

};

const changePassword = async (req, res, next) => {

    const { oldPassword, newPassword } = req.body;
    const { id } = req.user;

    if (!oldPassword || !newPassword) {
        return next(new AppError('All fields are required', 400));
    }

    const user = await User.findById(id).select('+password');

    if (!user) {
        return next(new AppError('User Doest Not Exists', 400));
    }

    const isPasswordValid = await user.comparePassword(oldPassword);

    if (!isPasswordValid) {
        return next(new AppError('Invalid Old Password', 400));
    }

    user.password = newPassword;

    await user.save();

    user.password = undefined;

    res.status(200).json({
        success: true,
        message: 'Password Changed Successfully!'
    });

};

const updateUser = async (req, res, next) => {
    const { fullName } = req.body;
    const id = req.user.id;

    const user = await User.findById(id);

    if (!user) {
        return next(new AppError('User does not exist', 400));
    }

    if (fullName) {
        user.fullName = fullName;
    }

    if (req.file) {
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);

        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'lms',
                width: 150,
                height: 150,
                gravity: 'face',
                crop: 'fill'
            });

            if (result) {
                user.avatar.public_id = result.public_id;
                user.avatar.secure_url = result.secure_url;

                fs.unlink(`uploads/${req.file.filename}`, (err) => {
                    if (err) console.error('Failed to delete local file:', err);
                });
            }
        } catch (error) {
            return next(new AppError('File upload failed', 500));
        }
    }

    await user.save();



    res.status(200).json({
        success: true,
        message: 'User Details Updated Successfully!'
    });
};


export { Register, Login, Logout, getProfile, forgotPassword, resetPassword, changePassword, updateUser };