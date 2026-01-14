import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Order from '../models/Order.js';
import Visit from '../models/Visit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger .env depuis la racine du projet
const envPath = join(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI n\'est pas défini dans le fichier .env');
  process.exit(1);
}

async function seedData() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB\n');

    // Vérifier les données existantes
    const existingVisits = await Visit.countDocuments();
    const existingOrders = await Order.countDocuments();
    
    console.log(`📊 Données existantes:`);
    console.log(`   Visites: ${existingVisits}`);
    console.log(`   Commandes: ${existingOrders}\n`);

    // Nettoyer les anciennes données de test (optionnel)
    const shouldClean = process.argv.includes('--clean');
    if (shouldClean) {
      console.log('🧹 Nettoyage des anciennes données...');
      await Order.deleteMany({});
      await Visit.deleteMany({});
      console.log('✅ Données nettoyées\n');
    } else if (existingVisits > 0 || existingOrders > 0) {
      console.log('ℹ️  Des données existent déjà. Les nouvelles données seront ajoutées.');
      console.log('   Utilisez "npm run seed:clean" pour tout nettoyer avant de régénérer.\n');
    }

    // Générer des visites pour les 30 derniers jours
    console.log('📊 Génération des visites...');
    const visits = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
      
      // Générer entre 20 et 150 visites par jour
      const visitsPerDay = Math.floor(Math.random() * 130) + 20;
      
      for (let j = 0; j < visitsPerDay; j++) {
        const visitDate = new Date(date);
        visitDate.setHours(
          Math.floor(Math.random() * 24),
          Math.floor(Math.random() * 60),
          Math.floor(Math.random() * 60),
          0
        );
        
        const paths = ['/', '/catalogue', '/produit/hismile'];
        visits.push({
          path: paths[Math.floor(Math.random() * paths.length)],
          referrer: Math.random() > 0.5 ? 'https://google.com' : '',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
          createdAt: visitDate,
        });
      }
    }
    
    await Visit.insertMany(visits);
    console.log(`✅ ${visits.length} visites créées\n`);

    // Générer des commandes pour les 30 derniers jours
    console.log('🛒 Génération des commandes...');
    const orders = [];
    const cities = ['Douala', 'Yaoundé', 'Bafoussam', 'Bamenda', 'Garoua', 'Maroua', 'Buea', 'Limbe'];
    const names = [
      'Jean Dupont', 'Marie Kouassi', 'Paul Nkono', 'Sophie Mbarga', 'Pierre Tchouassi',
      'Julie Nana', 'Marc Fotso', 'Anne Ngo', 'Luc Kamdem', 'Claire Mboum',
      'David Tchakounte', 'Sarah Ngu', 'Thomas Fokou', 'Emma Nkeng', 'Louis Ndi',
      'Laura Tchoupo', 'Kevin Nkeng', 'Emma Mbarga', 'Alex Nana', 'Julie Fotso'
    ];
    
    const statuses = ['new', 'called', 'pending', 'processing', 'in_delivery', 'delivered', 'cancelled'];
    const statusWeights = [0.2, 0.15, 0.1, 0.1, 0.15, 0.25, 0.05]; // Probabilités
    
    function getRandomStatus() {
      const rand = Math.random();
      let sum = 0;
      for (let i = 0; i < statuses.length; i++) {
        sum += statusWeights[i];
        if (rand <= sum) return statuses[i];
      }
      return 'new';
    }

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
      
      // Générer entre 2 et 12 commandes par jour
      const ordersPerDay = Math.floor(Math.random() * 10) + 2;
      
      for (let j = 0; j < ordersPerDay; j++) {
        const orderDate = new Date(date);
        orderDate.setHours(
          Math.floor(Math.random() * 24),
          Math.floor(Math.random() * 60),
          Math.floor(Math.random() * 60),
          0
        );
        
        const quantity = Math.random() > 0.7 ? 2 : 1;
        const totalPrice = quantity === 1 ? '9,900 FCFA' : '14,000 FCFA';
        
        orders.push({
          name: names[Math.floor(Math.random() * names.length)],
          phone: `2376${Math.floor(Math.random() * 90000000) + 10000000}`,
          city: cities[Math.floor(Math.random() * cities.length)],
          address: `Rue ${Math.floor(Math.random() * 100)}, Quartier ${Math.floor(Math.random() * 10)}`,
          productSlug: 'hismile',
          quantity,
          totalPrice,
          productPrice: quantity === 1 ? '9,900 FCFA' : '14,000 FCFA',
          productName: 'Hismile™ – Le Sérum Qui Blanchis tes dents dès le premier jour',
          productShortDesc: 'Sérum correcteur de teinte pour les dents. Effet instantané, sans peroxyde.',
          status: getRandomStatus(),
          createdAt: orderDate,
        });
      }
    }
    
    await Order.insertMany(orders);
    console.log(`✅ ${orders.length} commandes créées\n`);

    // Afficher un résumé
    const totalVisits = await Visit.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalRevenue = orders.reduce((sum, order) => {
      const price = order.totalPrice || '0';
      const numPrice = parseFloat(price.replace(/[^\d.]/g, '')) || 0;
      return sum + numPrice;
    }, 0);

    console.log('📊 Résumé des données:');
    console.log(`   Visites totales: ${totalVisits}`);
    console.log(`   Commandes totales: ${totalOrders}`);
    console.log(`   Revenus totaux: ${totalRevenue.toLocaleString('fr-FR')} FCFA`);
    console.log(`   Taux de conversion: ${((totalOrders / totalVisits) * 100).toFixed(2)}%\n`);

    console.log('✅ Données de test créées avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la création des données:', error);
    process.exit(1);
  }
}

seedData();
