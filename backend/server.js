const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');
const fs = require('fs');
const socketIo = require('socket.io');
const superAdminRealtimeEmitter = require('./middleware/superAdminRealtimeEmitter');
const { requestSanitizer } = require('./middleware/requestSanitizer');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const {
    SUPER_ADMIN_REFRESH_EVENT,
    SUPER_ADMIN_ROOM
} = require('./utils/superAdminRealtime');
const {
    ADMIN_REFRESH_EVENT,
    ADMIN_ROOM
} = require('./utils/adminRealtime');
const contestRoutes = require('./routes/contestRoutes');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
app.set('trust proxy', 1);
app.disable('x-powered-by');

mongoose.set('strictQuery', true);
const isProduction = String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production';
const configuredOrigins = String(process.env.CORS_ALLOWED_ORIGINS || process.env.CLIENT_URL || '')
    .split(',')
    .map((origin) => String(origin || '').trim())
    .filter(Boolean);
const localDevOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];
const allowedOrigins = new Set([
    ...configuredOrigins,
    ...(isProduction ? [] : localDevOrigins)
]);
const isTrustedLocalOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(String(origin || '').trim());
const isTrustedPrivateNetworkOrigin = (origin) => /^https?:\/\/(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/i.test(String(origin || '').trim());
const isTrustedCloudflareTunnelOrigin = (origin) => /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/i.test(String(origin || '').trim());
const isOriginAllowed = (origin) => {
    if (!origin) return true;
    const normalizedOrigin = String(origin).trim();
    if (allowedOrigins.has(normalizedOrigin)) {
        return true;
    }

    if (isProduction) {
        return false;
    }

    return (
        isTrustedLocalOrigin(normalizedOrigin) ||
        isTrustedPrivateNetworkOrigin(normalizedOrigin) ||
        isTrustedCloudflareTunnelOrigin(normalizedOrigin)
    );
};

const io = socketIo(server, {
    cors: {
        origin: (origin, callback) => {
            if (isOriginAllowed(origin)) {
                return callback(null, true);
            }
            return callback(new Error('Socket.IO origin not allowed'));
        },
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const PROBLEM_PRESENCE_ROOM_PREFIX = 'problem:presence:';
const problemPresenceMap = new Map(); // problemId -> Map(socketId -> identityKey)
const socketPresenceMap = new Map(); // socketId -> problemId

const DB_READY_STATE = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
};

const getDbStateLabel = () => DB_READY_STATE[mongoose.connection.readyState] || 'unknown';

const maskMongoUri = (uri) => {
    if (!uri || typeof uri !== 'string') return '';
    return uri.replace(/\/\/([^:/\s]+):([^@]+)@/, '//***:***@');
};

const normalizePresenceValue = (value) => {
    const normalized = String(value || '').trim();
    return normalized || null;
};

const getProblemPresenceRoom = (problemId) => `${PROBLEM_PRESENCE_ROOM_PREFIX}${problemId}`;

const emitProblemPresence = (problemId) => {
    const normalizedProblemId = normalizePresenceValue(problemId);
    if (!normalizedProblemId) return;

    const members = problemPresenceMap.get(normalizedProblemId);
    const unique = new Set(Array.from((members || new Map()).values()));

    io.to(getProblemPresenceRoom(normalizedProblemId)).emit('problem:active-users:update', {
        problemId: normalizedProblemId,
        count: unique.size
    });
};

const leaveProblemPresence = (socket, problemId) => {
    const normalizedProblemId = normalizePresenceValue(problemId);
    if (!socket || !normalizedProblemId) return;

    const members = problemPresenceMap.get(normalizedProblemId);
    if (!members) return;

    members.delete(socket.id);
    socket.leave(getProblemPresenceRoom(normalizedProblemId));
    socketPresenceMap.delete(socket.id);

    if (members.size === 0) {
        problemPresenceMap.delete(normalizedProblemId);
    } else {
        problemPresenceMap.set(normalizedProblemId, members);
    }

    emitProblemPresence(normalizedProblemId);
};

const joinProblemPresence = (socket, problemId, userId) => {
    const normalizedProblemId = normalizePresenceValue(problemId);
    if (!socket || !normalizedProblemId) return;

    const currentProblemId = socketPresenceMap.get(socket.id);
    if (currentProblemId && currentProblemId !== normalizedProblemId) {
        leaveProblemPresence(socket, currentProblemId);
    }

    const identityKey = normalizePresenceValue(userId)
        ? `user:${normalizePresenceValue(userId)}`
        : `guest:${socket.id}`;

    const members = problemPresenceMap.get(normalizedProblemId) || new Map();
    members.set(socket.id, identityKey);
    problemPresenceMap.set(normalizedProblemId, members);
    socketPresenceMap.set(socket.id, normalizedProblemId);
    socket.join(getProblemPresenceRoom(normalizedProblemId));

    emitProblemPresence(normalizedProblemId);
};

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
            return callback(null, true);
        }
        return callback(new Error('CORS origin not allowed'));
    },
    credentials: true
}));
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
});
app.use(express.json({ limit: process.env.REQUEST_BODY_LIMIT || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.REQUEST_BODY_LIMIT || '10mb' }));
app.use(requestSanitizer);
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(superAdminRealtimeEmitter());

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        dbState: getDbStateLabel()
    });
});

app.use('/api', (req, res, next) => {
    if (req.path === '/health') return next();
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            success: false,
            message: 'Database not connected. Please retry shortly.',
            dbState: getDbStateLabel()
        });
    }
    next();
});

// Database connection
// Database connection logic moved to startServer

// Routes (Placeholders for now)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/problems', require('./routes/problems'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/contests', contestRoutes);
app.use('/api/contest', contestRoutes);
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/doubts', require('./routes/doubtRoutes'));
app.use('/api/settings', require('./routes/settingRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/profiles', require('./routes/profileRoutes'));
app.use('/api/superadmin', require('./routes/superAdminRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// Serve frontend bundle in production when deploying as a single service.
if (isProduction) {
    const frontendDistPath = path.resolve(__dirname, '../frontend/dist');
    const frontendIndexPath = path.join(frontendDistPath, 'index.html');
    const frontendBuildExists = fs.existsSync(frontendIndexPath);

    if (frontendBuildExists) {
        app.use(express.static(frontendDistPath));
        app.get(/^\/(?!api\/).*/, (req, res) => {
            res.sendFile(frontendIndexPath);
        });
    } else {
        console.warn(`Frontend build missing at ${frontendIndexPath}. Run frontend build before deploying backend.`);
    }
}

// Socket.io setup
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('superadmin:subscribe', () => {
        socket.join(SUPER_ADMIN_ROOM);
    });

    socket.on('superadmin:unsubscribe', () => {
        socket.leave(SUPER_ADMIN_ROOM);
    });

    socket.on('admin:subscribe', () => {
        socket.join(ADMIN_ROOM);
    });

    socket.on('admin:unsubscribe', () => {
        socket.leave(ADMIN_ROOM);
    });

    socket.on(SUPER_ADMIN_REFRESH_EVENT, () => {
        // Ignore client-originated refresh emits. Server is the source of truth.
    });

    socket.on(ADMIN_REFRESH_EVENT, () => {
        // Ignore client-originated refresh emits. Server is the source of truth.
    });

    socket.on('problem:presence:join', (payload = {}) => {
        const problemId = normalizePresenceValue(payload.problemId);
        const userId = normalizePresenceValue(payload.userId);
        if (!problemId) return;
        joinProblemPresence(socket, problemId, userId);
    });

    socket.on('problem:presence:leave', (payload = {}) => {
        const payloadProblemId = normalizePresenceValue(payload.problemId);
        const socketProblemId = socketPresenceMap.get(socket.id);
        const targetProblemId = payloadProblemId || socketProblemId;
        if (!targetProblemId) return;
        leaveProblemPresence(socket, targetProblemId);
    });

    socket.on('disconnect', () => {
        const activeProblemId = socketPresenceMap.get(socket.id);
        if (activeProblemId) {
            leaveProblemPresence(socket, activeProblemId);
        }
        console.log('Client disconnected:', socket.id);
    });

    // Notification rooms — user joins their private room
    socket.on('notification:join', (userId) => {
        if (userId) {
            socket.join(`notifications:${userId}`);
        }
    });

    socket.on('notification:leave', (userId) => {
        if (userId) {
            socket.leave(`notifications:${userId}`);
        }
    });
});

// Make io accessible to routes
app.set('io', io);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('Missing MONGODB_URI (or MONGO_URI) in environment.');
        }

        console.log('Attempting to connect to DB at:', maskMongoUri(mongoUri));
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 10000),
            maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 20),
            minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 5)
        });
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1);
    }
};

const startServer = async () => {
    await connectDB();

    // Initialize Docker Code Execution Pool
    if (process.env.USE_DOCKER === 'true') {
        const containerPool = require('./services/containerPool');
        // Run in background to not block startup
        containerPool.initialize().catch(err => {
            console.error('Failed to initialize Docker Container Pool:', err.message);
        });
    }

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

const cluster = require('cluster');
const os = require('os');
const numCPUs = os.cpus().length;

if (require.main === module) {
    if (process.env.NODE_ENV === 'production' && cluster.isMaster) {
        console.log(`Master ${process.pid} is running`);

        // Fork workers.
        for (let i = 0; i < numCPUs; i++) {
            cluster.fork();
        }

        cluster.on('exit', (worker, code, signal) => {
            console.log(`Worker ${worker.process.pid} died. Restarting...`);
            cluster.fork();
        });
    } else {
        // Workers can share any TCP connection
        process.on('uncaughtException', (err) => {
            console.error('UNCAUGHT EXCEPTION! Shutting down...', err);
            process.exit(1);
        });

        process.on('unhandledRejection', (err) => {
            console.error('UNHANDLED REJECTION! Shutting down...', err);
            server.close(() => {
                process.exit(1);
            });
        });

        // Graceful Shutdown
        const gracefulShutdown = () => {
            console.log('Received kill signal, shutting down gracefully');
            server.close(() => {
                console.log('Closed out remaining connections');
                process.exit(0);
            });

            // Force close after 10s
            setTimeout(() => {
                console.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

        startServer();
    }
}

module.exports = { app, server, connectDB };
