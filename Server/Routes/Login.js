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
            { expiresIn: '7d' }
        );

        // Fixed cookie configuration
        const isProduction = process.env.NODE_ENV === 'production';
        
        // Cookie options based on environment
        const cookieOptions = {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        };

        if (isProduction) {
            // Production settings (for GitHub Pages or similar)
            cookieOptions.secure = true;
            cookieOptions.sameSite = 'none';
            // Don't set domain for GitHub Pages - let browser handle it
            // Only set domain if you have a custom domain
            if (process.env.CUSTOM_DOMAIN) {
                cookieOptions.domain = process.env.CUSTOM_DOMAIN;
            }
        } else {
            // Development settings
            cookieOptions.secure = false;
            cookieOptions.sameSite = 'lax';
            // Don't set domain for localhost
        }

        console.log('🍪 Setting cookie with options:', cookieOptions);
        res.cookie("auth_token", token, cookieOptions);

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

// Fixed logout endpoint
LoginHandler.post("/logout", (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    const cookieOptions = {
        httpOnly: true,
    };

    if (isProduction) {
        cookieOptions.secure = true;
        cookieOptions.sameSite = 'none';
        if (process.env.CUSTOM_DOMAIN) {
            cookieOptions.domain = process.env.CUSTOM_DOMAIN;
        }
    } else {
        cookieOptions.secure = false;
        cookieOptions.sameSite = 'lax';
    }

    res.clearCookie("auth_token", cookieOptions);
    
    res.json({ 
        success: true, 
        msg: "Logged out successfully" 
    });
});

module.exports = LoginHandler;