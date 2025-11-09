import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  verifyResetToken,
  forgotPassword,
  resetPassword,
  dashboardDetails,
  updateAccountDetails,
  getAllPlayers,
  getPlayers,
  sendMessage,
  getConversations,
  getMessages,
  getGames,
  brokenEquipmentTicket,
  verifyEmail,
  resendVerificationEmail
} from "../controllers/user.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Authentication
router.route("/register").post(registerUser);
router.route("/verify-email").post(verifyEmail);
router.route("/resend-verification-email").post(resendVerificationEmail);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/verify-reset-token").post(verifyResetToken);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(resetPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);

// Dashboard & Account
router.route("/dashboard").get(verifyJWT, dashboardDetails);
router.route("/update-account-details").post(verifyJWT, updateAccountDetails);

router.route("/get-all-players").get(verifyJWT, getAllPlayers);
router.route("/get-games").get(verifyJWT, getGames);
router.route("/get-players").get(verifyJWT, getPlayers);

// Messaging & Tickets
router.route("/send-message").post(verifyJWT, sendMessage);
router.route("/get-conversations").get(verifyJWT, getConversations);
router.route("/get-messages/:otherUserId").get(verifyJWT, getMessages);
router.route("/create-ticket").post(verifyJWT, brokenEquipmentTicket);

export default router;
