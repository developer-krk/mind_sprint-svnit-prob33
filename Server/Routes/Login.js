const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require("../model/Users");

const LoginHandler = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "SVNIT2028";

LoginHandler.post("/", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                msg: "Username and password are required" 
            });
        }

        const user = await User.findOne({ name: username });
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                msg: "Invalid credentials" 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                msg: "Invalid credentials" 
            });
        }

        const token = jwt.sign(
            { 
                id: user._id, 
                username: user.name 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // REMOVED: All cookie code
        // ADDED: Send token in response
        res.json({ 
            success: true, 
            msg: "Login successful",
            token: token,  // ← NEW: Send token to frontend
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

// Fixed logout endpoint with proper cross-origin cookie clearing
LoginHandler.post("/logout", (req, res) => {
    const origin = req.headers.origin;
    const isGitHubPages = origin && origin.includes('developer-krk.github.io');
    const isLocalhost = origin && origin.includes('localhost');
    
    let cookieOptions = {
        httpOnly: true,
    };

    if (isGitHubPages) {
        cookieOptions = {
            ...cookieOptions,
            secure: false,
            sameSite: 'none'
            // DO NOT set domain for cross-origin
        };
    } else if (isLocalhost) {
        cookieOptions = {
            ...cookieOptions,
            secure: false,
            sameSite: 'lax'
        };
    } else {
        cookieOptions = {
            ...cookieOptions,
            secure: true,
            sameSite: 'strict',
            domain: process.env.CUSTOM_DOMAIN || undefined
        };
    }

    console.log('🗑️ Clearing cookie with options:', cookieOptions);
    res.clearCookie("auth_token", cookieOptions);
    
    res.json({ 
        success: true, 
        msg: "Logged out successfully" 
    });
});

module.exports = LoginHandler;