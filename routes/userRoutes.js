const express = require("express");
const router = express.Router();
const {
  registerOrFindUser,
    setAdminRole,
  getUserRole,
} = require("../controllers/userController");

router.post("/users", registerOrFindUser); // Used by frontend
router.post("/users/admin", setAdminRole); // For manual admin setup
// Route to get user role by wallet address
router.get('/users/role/:wallet', getUserRole);

module.exports = router;
