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
app.use(cors());
app.use(express.json());

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

