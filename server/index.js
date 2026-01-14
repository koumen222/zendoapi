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
if (process.env.NODE_ENV !== 'production') {
  const envPath = join(__dirname, "..", ".env");
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    console.error("⚠️  Erreur lors du chargement du .env:", result.error.message);
    console.error("📁 Chemin recherché:", envPath);
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
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.has(origin)) return cb(null, true);
    // Allow all Cloudflare Pages deployments (*.zendof.pages.dev)
    if (origin.endsWith('.zendof.pages.dev')) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Admin-Key"],
  maxAge: 86400,
};

app.use(cors(corsOptions));
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

