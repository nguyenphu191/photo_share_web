const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/UserModel.js");
const router = express.Router();

const JWT_SECRET = "phu@toapp_secret";
const SALT_ROUNDS = 10;

router.post("/login", async (req, res) => {
  const { login_name, password } = req.body;

  try {
    const user = await User.findOne({ login_name });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).send({ error: "Invalid login name or password" });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "24h", // Token hết hạn sau 24 giờ
    });

    // Trả về user data đầy đủ hơn (không bao gồm password)
    const { password: pwd, ...userData } = user.toObject();

    res.send({ 
      token, 
      user: userData
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send({ error: "Internal server error" });
  }
});

router.post("/register", async (req, res) => {
  const {
    login_name,
    password,
    first_name,
    last_name,
    location,
    description,
    occupation,
  } = req.body;

  try {
    const existingUser = await User.findOne({ login_name });
    if (existingUser) {
      return res.status(409).send({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = new User({
      login_name,
      password: hashedPassword,
      first_name,
      last_name,
      location,
      description,
      occupation,
      avatar: '' // Khởi tạo avatar rỗng
    });
    
    await newUser.save();

    res.status(201).send({ message: "User registered successfully" });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).send({ error: "Internal server error" });
  }
});

router.post("/logout", (req, res) => {
  res.send({ message: "Successfully logged out" });
});

module.exports = router;