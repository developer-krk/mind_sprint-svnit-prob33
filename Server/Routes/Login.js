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

        // Cookie configuration for cross-origin (GitHub Pages + localhost)
        const origin = req.headers.origin;
        const isGitHubPages = origin && origin.includes('developer-krk.github.io');
        const isLocalhost = origin && origin.includes('localhost');
        
        let cookieOptions = {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        };

        if (isGitHubPages) {
            // GitHub Pages to localhost backend
            cookieOptions.secure = false; // Set to false for localhost backend
            cookieOptions.sameSite = 'none'; // Allow cross-origin
            // Don't set domain for cross-origin cookies
        } else if (isLocalhost) {
            // localhost to localhost
            cookieOptions.secure = false;
            cookieOptions.sameSite = 'lax';
        } else {
            // Production settings
            cookieOptions.secure = true;
            cookieOptions.sameSite = 'none';
            if (process.env.CUSTOM_DOMAIN) {
                cookieOptions.domain = process.env.CUSTOM_DOMAIN;
            }
        }

        console.log('🍪 Setting cookie with options:', cookieOptions);
        console.log('🌐 Request origin:', origin);
        
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
    const origin = req.headers.origin;
    const isGitHubPages = origin && origin.includes('developer-krk.github.io');
    const isLocalhost = origin && origin.includes('localhost');
    
    let cookieOptions = {
        httpOnly: true,
    };

    if (isGitHubPages) {
        cookieOptions.secure = false;
        cookieOptions.sameSite = 'none';
    } else if (isLocalhost) {
        cookieOptions.secure = false;
        cookieOptions.sameSite = 'lax';
    } else {
        cookieOptions.secure = true;
        cookieOptions.sameSite = 'none';
        if (process.env.CUSTOM_DOMAIN) {
            cookieOptions.domain = process.env.CUSTOM_DOMAIN;
        }
    }

    res.clearCookie("auth_token", cookieOptions);
    
    res.json({ 
        success: true, 
        msg: "Logged out successfully" 
    });
});

module.exports = LoginHandler;