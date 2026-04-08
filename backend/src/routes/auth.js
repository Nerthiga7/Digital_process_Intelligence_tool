const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password, login_time } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { userId: String(user._id), email: user.email, name: user.name, login_time: login_time || new Date().toISOString() },
      process.env.JWT_SECRET || "dev_secret_change_me",
      { expiresIn: "12h" }
    );

    return res.json({
      token,
      user: { id: String(user._id), name: user.name, email: user.email },
    });
  } catch (err) {
    return res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;

