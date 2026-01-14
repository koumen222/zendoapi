import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger .env depuis la racine du projet (seulement en développement local)
// Sur Railway, les variables d'environnement sont injectées automatiquement
const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT;
if (!isProduction) {
  const envPath = join(__dirname, "..", ".env");
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    // Only log error if file exists but couldn't be read (not if file doesn't exist)
    if (result.error.code !== 'ENOENT') {
      console.error("⚠️  Erreur lors du chargement du .env:", result.error.message);
      console.error("📁 Chemin recherché:", envPath);
    }
    // Silently ignore if .env doesn't exist (normal in some environments)
  } else {
    console.log("✅ Fichier .env chargé depuis:", envPath);
    console.log("🔑 Variables chargées:", Object.keys(result.parsed || {}).join(", "));
  }
} else {
  console.log("🌐 Mode production - Variables d'environnement depuis Railway");
}

const app = express();
app.set("trust proxy", true);

const ALLOWED_ORIGINS = new Set([
  "https://dd9845f3.zendof.pages.dev",
  "https://b12068c0.zendof.pages.dev",
  "https://zendo.site",
]);

const corsOptions = {
  origin(origin, cb) {
    // Allow non-browser clients (health checks, curl, server-to-server) with no Origin header.
    if (!origin) {
      console.log("🌐 CORS: No origin header (server-to-server request)");
      return cb(null, true);
    }
    
    // Normalize origin (remove trailing slash if present)
    const normalizedOrigin = origin.trim().replace(/\/$/, '');
    
    console.log(`🔍 CORS: Checking origin: "${normalizedOrigin}" (original: "${origin}")`);
    
    // Check exact matches first
    if (ALLOWED_ORIGINS.has(normalizedOrigin)) {
      console.log(`✅ CORS: Allowed origin (exact match): ${normalizedOrigin}`);
      return cb(null, true);
    }
    
    // Allow all Cloudflare Pages deployments (*.zendof.pages.dev)
    // More flexible check - just check if it contains the domain
    if (normalizedOrigin.includes('zendof.pages.dev')) {
      console.log(`✅ CORS: Allowed origin (Cloudflare Pages): ${normalizedOrigin}`);
      return cb(null, true);
    }
    
    // Also check via URL parsing for more robust matching
    try {
      const url = new URL(normalizedOrigin);
      if (url.hostname.includes('zendof.pages.dev')) {
        console.log(`✅ CORS: Allowed origin (Cloudflare Pages via URL parsing): ${normalizedOrigin}`);
        return cb(null, true);
      }
    } catch (e) {
      // URL parsing failed, continue with other checks
    }
    
    console.log(`❌ CORS: Blocked origin: ${normalizedOrigin}`);
    console.log(`📋 Allowed origins: ${Array.from(ALLOWED_ORIGINS).join(', ')}`);
    // Return false to deny, but allow CORS middleware to send proper response
    return cb(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Admin-Key"],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Debug middleware to log CORS requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    console.log(`🔍 OPTIONS preflight request from origin: ${origin || 'none'}`);
    console.log(`🔍 Request headers:`, {
      'access-control-request-method': req.headers['access-control-request-method'],
      'access-control-request-headers': req.headers['access-control-request-headers'],
    });
    
    // Check if origin should be allowed
    if (origin) {
      const normalizedOrigin = origin.trim().replace(/\/$/, '');
      const isAllowed = ALLOWED_ORIGINS.has(normalizedOrigin) || 
                       normalizedOrigin.includes('.zendof.pages.dev');
      console.log(`🔍 Origin allowed: ${isAllowed}`);
    }
  }
  next();
});

// Apply CORS to all routes - this must come before other routes
app.use(cors(corsOptions));

// Explicitly handle OPTIONS requests for all routes
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

import orderRoutes from "./routes/orders.js";
import adminRoutes from "./routes/admin.js";
import productRoutes from "./routes/products.js";
import analyticsRoutes from "./routes/analytics.js";

app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  
  res.json({ 
    status: "OK", 
    message: "Zendo COD API is running",
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

// Validation de MONGO_URI
if (!process.env.MONGO_URI) {
  console.error("❌ ERREUR: MONGO_URI n'est pas défini dans le fichier .env");
  console.error("📝 Créez un fichier .env à la racine du projet avec:");
  console.error("   MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/zendo");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connecté");
    app.listen(PORT, () => {
      console.log("🚀 Server running on port", PORT);
    });
  })
  .catch(err => console.error("❌ MongoDB error:", err));

