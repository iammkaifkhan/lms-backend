import { Router } from "express";
import { changePassword, forgotPassword, getProfile, Login, Logout, Register, resetPassword, updateUser } from "../controllers/userController.js";
import { isLoggedIn } from '../middlewares/authMiddleware.js';
import upload from "../middlewares/multerMiddleware.js";

const router = Router();

router.post('/register',upload.single('avatar'), Register);
router.post('/login', Login);
router.post('/logout', Logout);
router.get('/me',isLoggedIn, getProfile);
router.post('/reset', forgotPassword);
router.post('/reset/:resetToken', resetPassword);
router.post('/change-password',isLoggedIn, changePassword);
router.put('/update',isLoggedIn, upload.single('avatar'), updateUser);


export default router;