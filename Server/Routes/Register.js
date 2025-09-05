const express = require('express');
const bcrypt = require('bcrypt');
const User = require("../model/Users"); 

const RegisterHandler = express.Router();

RegisterHandler.post("/", async (req, res) => {
  try {
    const data = req.body; 
    if (!data.username || !data.password) {
      return res.status(400).json({ msg: "Username & Password required" });
    }

    const existing = await User.findOne({ name: data.username });
    if (existing) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await User.create({
      name: data.username,
      password: hashedPassword,
      subscription: []
    });

    res.status(201).json({
      msg: "User registered successfully",
      uid: newUser._id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "User registration failed" });
  }
});

module.exports = RegisterHandler;
