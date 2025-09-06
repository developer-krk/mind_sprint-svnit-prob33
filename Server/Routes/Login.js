const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require("../model/Users");

const LoginHandler = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "SVNIT2028";

LoginHandler.post("/", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Input validation
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                msg: "Username and password are required" 
            });
        }

        // Find user
        const user = await User.findOne({ name: username });
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                msg: "Invalid credentials" 
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                msg: "Invalid credentials" 
            });
        }

        // Generate JWT token with expiration
        const token = jwt.sign(
            { 
                id: user._id, 
                username: user.name 
            },
            JWT_SECRET,
            { expiresIn: '7d' } // Token expires in 7 days
        );

        // Set secure cookie
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie("auth_token", token, {
            domain: process.env.DOMAIN || (isProduction ? "developer-krk.github.io" : "localhost"),
            httpOnly: true,   
            secure: isProduction, // Only secure in production
            sameSite: isProduction ? "none" : "lax", // Cross-site cookies in production
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({ 
            success: true, 
            msg: "Login successful",
            user: {
                id: user._id,
                username: user.name
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            success: false, 
            msg: "Internal server error" 
        });
    }
});

// Logout endpoint
LoginHandler.post("/logout", (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie("auth_token", {
        domain: process.env.DOMAIN || (isProduction ? "developer-krk.github.io" : "localhost"),
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax"
    });
    
    res.json({ 
        success: true, 
        msg: "Logged out successfully" 
    });
});

module.exports = LoginHandler;