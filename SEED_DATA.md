# 📊 Guide pour générer des données de test

Ce guide explique comment générer des données de test pour remplir le dashboard avec des statistiques réalistes.

## 🚀 Génération des données

### Option 1 : Générer des données sans supprimer les existantes

```bash
npm run seed:data
```

Cette commande va :
- Créer environ **2,000-4,000 visites** réparties sur les 30 derniers jours
- Créer environ **60-360 commandes** réparties sur les 30 derniers jours
- Générer des données réalistes avec différents statuts de commande

### Option 2 : Nettoyer et régénérer toutes les données

```bash
npm run seed:clean
```

Cette commande va :
- **Supprimer** toutes les visites et commandes existantes
- Générer de nouvelles données de test

## 📈 Données générées

### Visites
- **20-150 visites par jour** sur les 30 derniers jours
- Réparties sur différentes pages : `/`, `/catalogue`, `/produit/hismile`
- Avec des référents et IPs variés

### Commandes
- **2-12 commandes par jour** sur les 30 derniers jours
- Statuts variés : new, called, pending, processing, in_delivery, delivered, cancelled
- Villes du Cameroun : Douala, Yaoundé, Bafoussam, Bamenda, etc.
- Quantités variées (1 ou 2 unités)
- Prix : 9,900 FCFA (1 unité) ou 14,000 FCFA (2 unités)

## ✅ Vérification

Après avoir exécuté le script, vous devriez voir dans le dashboard :

- **Visites** : ~2,000-4,000 visites
- **Ventes totales** : ~600,000-3,000,000 FCFA
- **Commandes** : ~60-360 commandes
- **Taux de conversion** : ~2-10%

## 🔄 Données réelles vs données de test

Le système utilise automatiquement :
- **Les vraies visites** : Chaque fois qu'un utilisateur visite le site, une visite est enregistrée
- **Les vraies commandes** : Chaque commande passée via le formulaire COD est enregistrée

Les données de test sont utiles pour :
- Tester le dashboard avec des données réalistes
- Développer et tester les fonctionnalités
- Former les utilisateurs

## 📝 Notes

- Les données de test sont générées avec des dates aléatoires dans les 30 derniers jours
- Les noms et numéros de téléphone sont fictifs
- Les données réelles continueront à s'accumuler même après avoir généré des données de test
