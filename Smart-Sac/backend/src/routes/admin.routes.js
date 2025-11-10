import { Router } from "express";
import { 
  loginAdmin, 
  logoutAdmin, 
  refreshAccessToken, 
  getCurrentAdmin,
  registerAdmin,
  updateAccountDetails,
  dashboardDetails,
  updateEquipment,
  addEquipment,
  removeEquipment,
  addGame,
  removeGame,
  getActiveTickets,
  updateTicket,
  getNoOfActiveTickets,
  makeAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
  getEquipment,
  getEquipmentHistory,
  getEquipmentRecentHistoryDict,
  getNoOfEquipmentHistory,
  getRecentEquipmentHistory,
  getNoOfAnnouncements
} from "../controllers/admin.controller.js";

import { verifyJWT } from "../middlewares/authadmin.middleware.js";

const router = Router();

router.route("/register").post(registerAdmin);
router.route("/login").post(loginAdmin);
router.route("/logout").post(verifyJWT, logoutAdmin);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/current-admin").get(verifyJWT, getCurrentAdmin);
router.route("/dashboard").get(verifyJWT, dashboardDetails);
router.route("/update-account-details").post(verifyJWT, updateAccountDetails);
router.route("/update-equipment").post(verifyJWT, updateEquipment);
router.route("/add-game").post(verifyJWT, addGame);
router.route("/remove-game").post(verifyJWT, removeGame);
router.route("/add-equipment").post(verifyJWT, addEquipment);
router.route("/remove-equipment").post(verifyJWT, removeEquipment);
router.route("/get-active-tickets").get(verifyJWT, getActiveTickets);
router.route("/update-ticket").post(verifyJWT, updateTicket);
router.route("/get-no-of-active-tickets").get(verifyJWT, getNoOfActiveTickets);
router.route("/make-announcement").post(verifyJWT, makeAnnouncement);
router.route("/get-announcements").get(verifyJWT, getAnnouncements);
router.route("/delete-announcement/:id").delete(verifyJWT, deleteAnnouncement);
router.route("/get-equipment").get(verifyJWT, getEquipment);
router.route("/get-equipment-history").get(verifyJWT, getEquipmentHistory);
router.route("/get-equipment-recent-history-dict").get(verifyJWT, getEquipmentRecentHistoryDict);
router.route("/get-no-of-equipment-history").get(verifyJWT, getNoOfEquipmentHistory);
router.route("/get-recent-equipment-history").get(verifyJWT, getRecentEquipmentHistory);
router.route("/get-no-of-announcements").get(verifyJWT, getNoOfAnnouncements);

export default router;
