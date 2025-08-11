import { Router } from "express";
import { allPayments, buySubscription, cancelSubscription, getRazorpayApiKey, verifySubscription } from "../controllers/paymentController.js";
import { isLoggedIn, authorizedRoles, authorizedSubscribers } from '../middlewares/authMiddleware.js';

const router = Router();

router.route('/subscribe').post(isLoggedIn, buySubscription);
router.route('/verify').post(isLoggedIn, verifySubscription);
router
    .route('/unsubscribe')
    .post(isLoggedIn, authorizedSubscribers, cancelSubscription);
router.route('/razorpay-key').get(isLoggedIn, getRazorpayApiKey);
router.route('/').get(isLoggedIn, authorizedRoles('ADMIN'), allPayments);

export default router;