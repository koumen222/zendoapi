# Configuration WhatsApp Cloud API

## Variables d'environnement à ajouter dans `.env`

Ajoutez ces variables dans votre fichier `.env` à la racine du projet :

```env
# WhatsApp Cloud API Configuration
WHATSAPP_ACCESS_TOKEN=votre_token_d_acces_whatsapp_business
WHATSAPP_PHONE_NUMBER_ID=votre_phone_number_id
ADMIN_PHONE=237676463725
```

## Comment obtenir les credentials WhatsApp

### 1. Créer une application Meta

1. Allez sur [Meta for Developers](https://developers.facebook.com/)
2. Créez une application de type "Business"
3. Ajoutez le produit "WhatsApp" à votre application

### 2. Obtenir le Phone Number ID

1. Dans votre application Meta, allez dans "WhatsApp" > "API Setup"
2. Vous verrez votre "Phone number ID" (ex: `913249341870874`)
3. **Votre configuration actuelle** :
   - Numéro test qui envoie : `+1 555 190 7419`
   - Phone Number ID : `913249341870874`
   - WhatsApp Business Account ID : `863878739557487`

### 3. Obtenir l'Access Token

1. Dans "WhatsApp" > "API Setup"
2. Cliquez sur "Generate token" ou utilisez un token système
3. Copiez le token (commence généralement par `EAA...`)

### 4. Configurer les numéros de téléphone

**Numéro qui ENVOIE** (WhatsApp Business) :
- Phone Number ID : `913249341870874`
- Numéro associé : `+1 555 190 7419` (numéro de test)
- WhatsApp Business Account ID : `863878739557487`
- Configuré via `WHATSAPP_PHONE_NUMBER_ID=913249341870874` dans `.env`

**Numéro qui REÇOIT** (Admin) :
- Numéro admin configuré : `+237 6 76 46 37 25`
- Format dans `.env` : `237676463725` (sans + et sans espaces)
- Configuré via `ADMIN_PHONE=237676463725` dans `.env`
- **IMPORTANT** : Ce numéro doit être ajouté à la liste des destinataires autorisés dans le dashboard Meta

## Format du message envoyé

Lorsqu'une commande est créée, vous recevrez automatiquement un message WhatsApp au format :

```
🛒 NOUVELLE COMMANDE

👤 Nom: [Nom du client]
📞 Téléphone: [Téléphone]
📦 Produit: [Nom du produit]
💰 Prix: [Prix] FCFA
📍 Ville: [Ville]
```

## Test

Pour tester, créez une commande via le formulaire. Le message WhatsApp sera envoyé automatiquement à votre numéro admin.

## Dépannage

### Erreur 131030 : "Recipient phone number not in allowed list"

**Problème** : Le numéro de téléphone du destinataire n'est pas dans la liste autorisée.

**Solution** :
1. Allez sur [Meta for Developers](https://developers.facebook.com/)
2. Sélectionnez votre application
3. Allez dans **WhatsApp** > **API Setup**
4. Trouvez la section **"To"** ou **"Recipient phone numbers"**
5. Cliquez sur **"Manage phone number list"** ou **"Add phone number"**
6. Ajoutez le numéro `237676463725` (sans le + et sans espaces)
7. Attendez quelques minutes pour que la modification prenne effet
8. Réessayez d'envoyer un message

**Note** : En mode développement/test, vous ne pouvez envoyer des messages qu'aux numéros que vous avez explicitement ajoutés à cette liste. En production, cette restriction est levée.

### Autres erreurs

- **Erreur 401** : Vérifiez que votre `WHATSAPP_ACCESS_TOKEN` est valide et non expiré
- **Erreur 404** : Vérifiez que votre `WHATSAPP_PHONE_NUMBER_ID` est correct
- **Message non reçu** : Vérifiez que le numéro `ADMIN_PHONE` est correct et vérifié
