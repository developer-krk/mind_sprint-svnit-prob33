const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet'); 
require('dotenv').config();

// Import routes and middleware
const RegisterHandler = require('./Routes/Register');
const LoginHandler = require('./Routes/Login');
const SubscriptionHandler = require('./Routes/Dashboard');
const { verifyToken, getUserFromToken } = require('./Controller/Auth');

const app = express();
const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI;

// Environment check
const isProduction = process.env.NODE_ENV === 'production';

// Security middleware with relaxed settings for development
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" } // Added for cross-origin requests
}));

// Enhanced CORS Configuration for GitHub Pages + localhost
const corsOptions = {
    origin: function (origin, callback) {
        // Define allowed origins
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:8080',
            'https://developer-krk.github.io', // Your GitHub Pages domain
            'https://your-custom-domain.com'
        ];
        
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('🚫 Blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // This is crucial for cookies!
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With', 
        'Accept',
        'Origin',
        'Cache-Control',
        'Pragma',
        'Cookie' // Added Cookie header
    ],
    exposedHeaders: ['Set-Cookie'], // Expose set-cookie header
    preflightContinue: false,
    optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Enhanced CORS headers middleware for GitHub Pages compatibility
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
        "https://developer-krk.github.io",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080"
    ];
    
    if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Access-Control-Allow-Credentials", "true");
        res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, X-Requested-With, Origin, Cache-Control, Pragma, Cookie");
        res.header("Access-Control-Expose-Headers", "Set-Cookie");
    }
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        console.log('✅ Handling preflight request from:', origin);
        return res.status(200).end();
    }
    
    next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Enhanced request logging middleware (development only)
if (!isProduction) {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        console.log('Origin:', req.headers.origin);
        console.log('User-Agent:', req.headers['user-agent']);
        console.log('Cookies received:', Object.keys(req.cookies).length > 0 ? req.cookies : 'No cookies');
        console.log('---');
        next();
    });
}

// Database connection with better error handling
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log("🟢 MongoDB Connected Successfully");
})
.catch(err => {
    console.error("🔴 MongoDB Connection Error:", err.message);
    process.exit(1);
});

// Handle MongoDB connection events
mongoose.connection.on('error', err => {
    console.error('🔴 MongoDB Error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🟡 MongoDB Disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🟡 Shutting down gracefully...');
    await mongoose.connection.close();
    process.exit(0);
});

// Health check endpoint with CORS info
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        cors: {
            origin: req.headers.origin,
            cookies: Object.keys(req.cookies).length
        }
    });
});

// Test endpoint for cookie verification
app.get('/api/test-cookie', (req, res) => {
    const cookies = req.cookies;
    res.json({
        success: true,
        message: 'Cookie test endpoint',
        cookiesReceived: cookies,
        hasAuthToken: !!cookies.auth_token,
        origin: req.headers.origin
    });
});

// API Routes
app.use("/api/auth/register", RegisterHandler);
app.use("/api/auth/login", LoginHandler);
app.use("/api/user", verifyToken, getUserFromToken);
app.use("/api/dashboard", verifyToken, SubscriptionHandler);

// Protected dashboard endpoint (if needed separately)
app.get('/api/dashboard/test', verifyToken, (req, res) => {
    res.json({
        success: true,
        message: 'Dashboard access granted',
        user: req.user
    });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
    console.error('🔴 Error:', err.stack);
    
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            success: false,
            msg: 'CORS policy violation',
            origin: req.headers.origin
        });
    }
    
    res.status(500).json({
        success: false,
        msg: 'Internal server error',
        ...(isProduction ? {} : { error: err.message })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        msg: 'Route not found'
    });
});

// Start server with enhanced logging
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Allowing requests from: https://developer-krk.github.io`);
    console.log(`🍪 Cross-origin cookies: ENABLED`);
    console.log(`📡 CORS credentials: ENABLED`);
    console.log('---');
});