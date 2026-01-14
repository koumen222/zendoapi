import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
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

// ============================================================================
// CORS MIDDLEWARE MANUEL - AVANT TOUTES LES ROUTES
// ============================================================================
const ALLOWED_ORIGINS = [
  "https://b12068c0.zendof.pages.dev",
  "https://40060d2a.zendof.pages.dev",
  "https://zendo.site",
  "https://safiroecommerce.shop",
];

// Fonction pour vérifier si une origine est autorisée
const isOriginAllowed = (origin) => {
  if (!origin) return false;
  
  // Vérifier les origines exactes
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }
  
  // Autoriser toutes les origines Cloudflare Pages (*.zendof.pages.dev)
  if (origin.includes('zendof.pages.dev')) {
    return true;
  }
  
  return false;
};

// Middleware CORS manuel
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    if (isOriginAllowed(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Key');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
      return res.status(204).end();
    } else {
      console.log(`❌ CORS: Blocked preflight from origin: ${origin}`);
      return res.status(403).json({ error: 'CORS: Origin not allowed' });
    }
  }
  
  // Pour toutes les autres requêtes, ajouter les en-têtes CORS si l'origine est autorisée
  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (origin) {
    console.log(`❌ CORS: Blocked request from origin: ${origin}`);
  }
  
  next();
});

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

