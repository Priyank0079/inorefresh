import express, { Application, Request, Response } from "express";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import { ensureDefaultAdmin } from "./utils/ensureDefaultAdmin";
import { seedHeaderCategories } from "./utils/seedHeaderCategories";
import { initializeSocket } from "./socket/socketService";
import { initializeFirebaseAdmin } from "./services/firebaseAdmin";

// Port Auth Prioritized Routes (Imports moved to top)
import * as portAuthController from "./modules/port/controllers/portAuthController";
import { authenticate, requireUserType } from "./middleware/auth";

// Load environment variables
dotenv.config();

// Application initialization
const app: Application = express();
const httpServer = createServer(app);

// Simple CORS configuration - Standard and reliable
const allowedOrigins = [
  "https://www.dhakadsnazzy.com",
  "https://dhakadsnazzy.com",
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",").map(url => url.trim()) : [])
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== "production") {
      if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
        return callback(null, true);
      }
    }
    const normalizedOrigin = origin.replace(/\/$/, '');
    const isAllowed = allowedOrigins.some(allowed => {
      const normalizedAllowed = allowed.replace(/\/$/, '');
      return origin === allowed || normalizedOrigin === normalizedAllowed || origin === normalizedAllowed || normalizedOrigin === allowed;
    });
    if (isAllowed) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Debug Route
app.get("/api/v1/debug-status", (req, res) => {
  res.json({ success: true, timestamp: new Date().toISOString(), reloaded: true });
});

// Port Module Routes (Direct mount for stability)
import portAuthRoutes from "./modules/port/routes/portAuthRoutes";
import portRoutes from "./modules/port/routes/portRoutes";
app.use("/api/v1/port/auth", portAuthRoutes);
app.use("/api/v1/port", portRoutes);

app.get("/api/v1/port/public-test", (req, res) => {
  res.json({ success: true, message: "Port routing is working" });
});

// API Routes
app.use("/api/v1", routes);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 7000;

async function startServer() {
  await connectDB();
  await ensureDefaultAdmin();
  await seedHeaderCategories();
  initializeFirebaseAdmin();

  httpServer.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\nPort ${PORT} is already in use!`);
      process.exit(1);
    } else {
      console.error('\nServer error:', error);
      process.exit(1);
    }
  });

  httpServer.listen(PORT, () => {
    console.log(`\n✓ dhakadsnazzy Server Started on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("\n✗ Failed to start server", err);
  process.exit(1);
});
