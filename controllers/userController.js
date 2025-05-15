const User = require("../models/User");

// Create or find user by wallet
const registerOrFindUser = async (req, res) => {
  const { wallet } = req.body;
  if (!wallet) return res.status(400).json({ message: "Wallet is required" });

  try {
    let user = await User.findOne({ wallet });

    if (!user) {
      // Create new user with default role "user"
      user = await User.create({ wallet });
    }

    res.status(200).json({ wallet: user.wallet, role: user.role });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Admin-only: Add admin manually (for testing)
const setAdminRole = async (req, res) => {
  const { wallet } = req.body;
  if (!wallet) return res.status(400).json({ message: "Wallet is required" });

  try {
    const user = await User.findOneAndUpdate(
      { wallet },
      { role: "admin" },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "Admin role assigned", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};



// Get user role by wallet address
const getUserRole = async (req, res) => {
  const { wallet } = req.params;

  try {
    const user = await User.findOne({ wallet });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ role: user.role }); // Send only the role
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = {
  registerOrFindUser,
    setAdminRole,
  getUserRole
};
