const jwt = require('jsonwebtoken'); // Fixed: was 'jason-web-token'
const User = require('../model/Users');

const JWT_SECRET = process.env.JWT_SECRET || "SVNIT2028";

// Get user information from token
const getUser = async (req, res) => {
    try {
        const token = req.cookies.auth_token;
        
        if (!token) {
            return res.status(401).json({
                success: false,
                msg: "Access denied. No token provided."
            });
        }

        // Verify and decode token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Fetch complete user data from database
        const user = await User.findById(decoded.id).select('-password'); // Exclude password
        
        if (!user) {
            return res.status(404).json({
                success: false,
                msg: "User not found"
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.name,
                subscriptions: user.subs || [],
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });

    } catch (err) {
        console.error('Get user error:', err.message);
        
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                msg: "Token has expired"
            });
        }
        
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                msg: "Invalid token"
            });
        }
        
        return res.status(500).json({
            success: false,
            msg: "Failed to retrieve user information"
        });
    }
};

// Update user profile
const updateUser = async (req, res) => {
    try {
        const { username } = req.body;
        const userId = req.user.id;

        // Input validation
        if (!username || username.trim().length < 3) {
            return res.status(400).json({
                success: false,
                msg: "Username must be at least 3 characters long"
            });
        }

        // Check if username already exists (case-insensitive)
        const existingUser = await User.findOne({
            name: { $regex: new RegExp(`^${username.trim()}$`, 'i') },
            _id: { $ne: userId } // Exclude current user
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                msg: "Username already exists"
            });
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name: username.trim() },
            { new: true, select: '-password' }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                msg: "User not found"
            });
        }

        res.json({
            success: true,
            msg: "Profile updated successfully",
            user: {
                id: updatedUser._id,
                username: updatedUser.name
            }
        });

    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({
            success: false,
            msg: "Failed to update profile"
        });
    }
};

// Delete user account
const deleteUser = async (req, res) => {
    try {
        const userId = req.user.id;

        // Delete user and all associated subscriptions
        const Subscription = require('../model/subscription');
        await Subscription.deleteMany({ userId: userId });
        await User.findByIdAndDelete(userId);

        // Clear auth cookie
        const isProduction = process.env.NODE_ENV === 'production';
        res.clearCookie("auth_token", {
            domain: process.env.DOMAIN || (isProduction ? "developer-krk.github.io" : "localhost"),
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax"
        });

        res.json({
            success: true,
            msg: "Account deleted successfully"
        });

    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({
            success: false,
            msg: "Failed to delete account"
        });
    }
};

module.exports = {
    getUser,
    updateUser,
    deleteUser
};