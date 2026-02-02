import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import compression from "compression";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * ENV
 */
const isProduction =
  process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT;

if (isProduction) {
  const noop = () => {};
  console.log = noop; // Désactiver les logs en production (perf + bruit)
  console.info = noop;
  console.debug = noop;
}

if (!isProduction) {
  const envPath = join(__dirname, "..", ".env");
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    if (result.error.code !== "ENOENT") {
      console.error("⚠️ Erreur chargement .env:", result.error.message);
    }
  } else {
    console.log("✅ .env chargé:", envPath);
  }
} else {
  console.log("🌐 Mode production (Railway)");
}

const app = express();
app.set("trust proxy", true);
app.use(compression());

/**
 * ============================================================================
 * CORS — VERSION PRO, STABLE, CLOUDFARE COMPATIBLE
 * ============================================================================
 */

const ALLOWED_ORIGINS = [
  "https://b12068c0.zendof.pages.dev",
  "https://40060d2a.zendof.pages.dev",
  "https://zendo.site",
  "https://safiroecommerce.shop",
  "https://www.safiroecommerce.shop",
  "http://localhost:3000",
  "http://localhost:5173",
];

// Vérification d’origine
const isOriginAllowed = (origin) => {
  if (!origin) return true; // Postman / server-to-server

  // Origines exactes
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  // Cloudflare Pages → TOUS les sous-domaines
  if (origin.endsWith(".pages.dev")) {
    return true;
  }

  // Sous-domaines safiroecommerce.shop
  if (origin.endsWith(".safiroecommerce.shop")) {
    return true;
  }

  return false;
};

// Middleware CORS GLOBAL
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // PREFLIGHT — TOUJOURS RÉPONDRE
  if (req.method === "OPTIONS") {
    if (origin && isOriginAllowed(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Admin-Key"
      );
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Max-Age", "86400");
    }
    return res.status(204).end();
  }

  // REQUÊTES NORMALES
  if (origin && isOriginAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  next();
});

app.use(express.json({ limit: "1mb" }));

/**
 * ============================================================================
 * ROUTES
 * ============================================================================
 */
const { default: orderRoutes } = await import("./routes/orders.js");
const { default: adminRoutes } = await import("./routes/admin.js");
const { default: productRoutes } = await import("./routes/products.js");
const { default: analyticsRoutes } = await import("./routes/analytics.js");

app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/analytics", analyticsRoutes);

/**
 * ============================================================================
 * ERROR HANDLING (log erreurs backend)
 * ============================================================================
 */
app.use((err, req, res, next) => {
  console.error("❌ API error:", {
    message: err?.message,
    path: req?.originalUrl,
    method: req?.method,
    status: err?.status || 500,
  });

  res.status(err?.status || 500).json({
    success: false,
    message: "Erreur interne du serveur",
  });
});

/**
 * HEALTH CHECK
 */
app.get("/api/health", (req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  res.json({
    status: "OK",
    message: "Zendo COD API is running",
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

/**
 * ============================================================================
 * SERVER + DATABASE
 * ============================================================================
 */

const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI) {
  console.error("❌ ERREUR: MONGO_URI manquant");
  process.exit(1);
}

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connecté");
    app.listen(PORT, () => {
      console.log("🚀 Server running on port", PORT);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB error:", err.message);
  });
