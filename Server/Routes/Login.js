const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require("../model/Users");

const LoginHandler = express.Router();
const JWT_SECRET = process.env.JWT_SECRET||"SVNIT2028";

LoginHandler.post("/", async (req, res) => {
  try {
    const { username, password } = req.body;

    const existing = await User.findOne({ name: username });
    if (!existing) {
      return res.status(400).json({ msg: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, existing.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid password" });
    }

    const token = jwt.sign(
      { id: existing._id, username: existing.name },
      JWT_SECRET,
    );

    res.cookie("auth_token", token, {
      domain:process.env.Domain ||"developer-krk.github.io",
      httpOnly: true,   
      secure: false,    
      sameSite: "strict",
    });

    res.json({ msg: "success" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Login failed" });
  }
});

module.exports = LoginHandler;
