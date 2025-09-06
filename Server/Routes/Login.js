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

        // Cookie configuration for cross-origin (GitHub Pages to localhost)
        const origin = req.headers.origin;
        const isGitHubPages = origin && origin.includes('developer-krk.github.io');
        const isLocalhost = origin && origin.includes('localhost');
        
        // Fixed cookie configuration for cross-origin
        let cookieOptions = {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        };

        // Key fix: For GitHub Pages to localhost, use these specific settings
        if (isGitHubPages) {
            cookieOptions = {
                ...cookieOptions,
                secure: false,        // MUST be false for localhost backend
                sameSite: 'none',     // Required for cross-origin
                // DO NOT set domain for cross-origin cookies
            };
        } else if (isLocalhost) {
            // localhost to localhost (for testing)
            cookieOptions = {
                ...cookieOptions,
                secure: false,
                sameSite: 'lax',
                // domain: 'localhost' // Don't set domain
            };
        } else {
            // Production settings (when both frontend and backend are on same domain)
            cookieOptions = {
                ...cookieOptions,
                secure: true,
                sameSite: 'strict',
                domain: process.env.CUSTOM_DOMAIN || undefined
            };
        }

        console.log('🍪 Setting cookie with options:', cookieOptions);
        console.log('🌐 Request origin:', origin);
        console.log('🔧 User-Agent:', req.headers['user-agent']);
        
        // Set the cookie
        res.cookie("auth_token", token, cookieOptions);

        // Additional headers for cross-origin compatibility
        if (isGitHubPages) {
            res.header('Access-Control-Allow-Credentials', 'true');
            res.header('Access-Control-Allow-Origin', origin);
        }

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