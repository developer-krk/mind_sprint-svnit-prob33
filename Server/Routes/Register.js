const express = require('express');
const bcrypt = require('bcrypt');
const User = require("../model/Users"); 

const RegisterHandler = express.Router();

// Input validation helper
const validateInput = (username, password) => {
    const errors = [];
    
    if (!username || username.trim().length < 3) {
        errors.push("Username must be at least 3 characters long");
    }
    
    if (!password || password.length < 6) {
        errors.push("Password must be at least 6 characters long");
    }
    
    if (username && username.length > 30) {
        errors.push("Username must not exceed 30 characters");
    }
    
    // Basic password strength check
    if (password && !/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
        errors.push("Password must contain at least one letter and one number");
    }
    
    return errors;
};

RegisterHandler.post("/", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Input validation
        const validationErrors = validateInput(username, password);
        if (validationErrors.length > 0) {
            return res.status(400).json({ 
                success: false, 
                msg: "Validation failed",
                errors: validationErrors 
            });
        }

        // Check if user already exists
        const existing = await User.findOne({ 
            name: { $regex: new RegExp(`^${username.trim()}$`, 'i') } // Case-insensitive
        });
        
        if (existing) {
            return res.status(409).json({ 
                success: false, 
                msg: "Username already exists" 
            });
        }

        // Hash password with higher salt rounds for better security
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user
        const newUser = await User.create({
            name: username.trim(),
            password: hashedPassword,
            subs: [] // Fixed: should be 'subs' not 'subscription' based on Dashboard.js
        });

        res.status(201).json({
            success: true,
            msg: "User registered successfully",
            user: {
                id: newUser._id,
                username: newUser.name
            }
        });

    } catch (err) {
        console.error('Registration error:', err);
        
        if (err.code === 11000) {
            // MongoDB duplicate key error
            return res.status(409).json({ 
                success: false, 
                msg: "Username already exists" 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            msg: "User registration failed" 
        });
    }
});

module.exports = RegisterHandler;