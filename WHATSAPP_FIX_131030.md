# 🔧 Fix Erreur 131030 - WhatsApp Cloud API

## Problème
```
❌ Erreur: (#131030) Recipient phone number not in allowed list
```

Cette erreur signifie que le numéro de téléphone `237676463725` n'est pas dans la liste des destinataires autorisés de votre application WhatsApp.

## Solution étape par étape

### 1. Accéder au Dashboard Meta
1. Allez sur https://developers.facebook.com/
2. Connectez-vous avec votre compte Meta
3. Sélectionnez votre application WhatsApp Business

### 2. Ajouter le numéro à la liste autorisée
1. Dans le menu de gauche, cliquez sur **"WhatsApp"**
2. Cliquez sur **"API Setup"** ou **"Configuration"**
3. Faites défiler jusqu'à la section **"To"** ou **"Phone numbers"**
4. Cherchez **"Manage phone number list"** ou **"Add phone number"**
5. Cliquez sur **"Add phone number"** ou le bouton **"+"**

### 3. Entrer le numéro
- Entrez le numéro : `237676463725`
- **Important** : Entrez-le sans le `+` et sans espaces
- Format attendu : `237676463725` (pas `+237 676 46 37 25`)

### 4. Vérifier
- Le numéro devrait apparaître dans la liste des numéros autorisés
- Attendez 2-3 minutes pour que la modification prenne effet

### 5. Réessayer
- Créez une nouvelle commande via le formulaire
- Le message WhatsApp devrait maintenant être envoyé avec succès

## Vérification dans le code

Le numéro est configuré dans votre `.env` :
```env
ADMIN_PHONE=237676463725
```

Assurez-vous que ce numéro correspond exactement à celui ajouté dans le dashboard Meta.

## Mode Développement vs Production

- **Mode Développement/Test** : Vous devez ajouter chaque numéro manuellement
- **Mode Production** : Une fois votre application approuvée, vous pouvez envoyer à n'importe quel numéro

## Alternative : Utiliser le numéro de test Meta

Si vous voulez tester rapidement sans ajouter de numéro :
1. Dans le dashboard Meta, utilisez le numéro de test fourni
2. Mettez à jour `ADMIN_PHONE` dans `.env` avec ce numéro de test
3. Les messages seront envoyés à ce numéro de test

## Logs pour vérifier

Après avoir ajouté le numéro, vous devriez voir dans les logs :
```
✅ MESSAGE WHATSAPP ENVOYÉ AVEC SUCCÈS
📨 Message ID: wamid.xxx...
```

Au lieu de :
```
❌ WhatsApp NON envoyé
🔍 Raison: (#131030) Recipient phone number not in allowed list
```
