const express = require("express");
const router = express.Router();


const { findUserByEmail, promoteUser, demoteUser, getAllUsers, deleteUser } = require("../controllers/employeecontroller");

const authAdminMiddleware = require("../middleware/authAdminMiddleware");

router.get("/find", authAdminMiddleware, findUserByEmail);
router.put("/promote/:id", authAdminMiddleware, promoteUser);
router.put("/demote/:id", authAdminMiddleware, demoteUser);
router.get("/all", authAdminMiddleware, getAllUsers);
router.delete("/delete/:id", authAdminMiddleware, deleteUser);
  
module.exports = router;