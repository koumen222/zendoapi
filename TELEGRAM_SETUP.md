# Configuration Telegram Bot

## Variables d'environnement à ajouter dans `.env`

Ajoutez ces variables dans votre fichier `.env` à la racine du projet :

```env
# Telegram Bot Configuration
TG_TOKEN=votre_token_bot_telegram
TG_CHAT_IDS=votre_chat_id_telegram_1,votre_chat_id_telegram_2
```

**Note** : Pour envoyer à plusieurs chat IDs, séparez-les par des virgules (sans espaces) :
```env
TG_CHAT_IDS=123456789,987654321,555666777
```

**Compatibilité** : Le code accepte aussi `TG_CHAT_ID` (ancien format) pour compatibilité, mais `TG_CHAT_IDS` est recommandé.

## Comment obtenir les credentials Telegram

### 1. Créer un bot Telegram

1. Ouvrez Telegram et cherchez **@BotFather**
2. Envoyez la commande `/newbot`
3. Suivez les instructions pour donner un nom et un username à votre bot
4. BotFather vous donnera un **token** (ex: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
5. Copiez ce token et ajoutez-le dans `.env` comme `TG_TOKEN`

### 2. Obtenir votre Chat ID

**Méthode 1 : Via @userinfobot**
1. Cherchez **@userinfobot** sur Telegram
2. Commencez une conversation avec ce bot
3. Il vous donnera votre Chat ID (ex: `123456789`)
4. Copiez ce Chat ID et ajoutez-le dans `.env` comme `TG_CHAT_ID`

**Méthode 2 : Via votre bot**
1. Envoyez un message à votre bot
2. Visitez : `https://api.telegram.org/bot<VOTRE_TOKEN>/getUpdates`
3. Cherchez `"chat":{"id":123456789}` dans la réponse JSON
4. Le nombre `123456789` est votre Chat ID

**Méthode 3 : Via code (temporaire)**
Ajoutez temporairement ce code dans votre route pour voir le Chat ID :
```javascript
// Dans server/routes/orders.js (temporaire)
const telegramUrl = `https://api.telegram.org/bot${process.env.TG_TOKEN}/getUpdates`;
const response = await axios.get(telegramUrl);
console.log('Updates:', JSON.stringify(response.data, null, 2));
```

## Format du message envoyé

Lorsqu'une commande est créée, vous recevrez automatiquement un message Telegram au format :

```
🛒 NOUVELLE COMMANDE

👤 Nom: [Nom du client]
📞 Téléphone: [Téléphone]
📦 Produit: [Nom du produit]
💰 Prix: [Prix] FCFA
📍 Ville: [Ville]
```

## Test

Pour tester :
1. Créez une commande via le formulaire
2. Le message Telegram sera envoyé automatiquement à votre Chat ID
3. Vérifiez votre conversation Telegram avec le bot

## Dépannage

### Erreur 401 : Unauthorized
- Vérifiez que votre `TG_TOKEN` est correct
- Assurez-vous qu'il n'y a pas d'espaces avant/après le token

### Erreur 400 : Bad Request - chat not found
- Vérifiez que votre `TG_CHAT_ID` est correct
- Assurez-vous d'avoir envoyé au moins un message à votre bot avant
- Le Chat ID doit être un nombre (ex: `123456789`)

### Message non reçu
- Vérifiez que vous avez bien démarré une conversation avec votre bot
- Envoyez `/start` à votre bot si nécessaire
- Vérifiez les logs dans le terminal pour voir les erreurs détaillées

## Exemple de `.env` complet

```env
MONGO_URI=mongodb://localhost:27017/zendo
ADMIN_KEY=ZENDO_ADMIN_2026
PORT=3001
NODE_ENV=development

# WhatsApp Cloud API Configuration
WHATSAPP_ACCESS_TOKEN=votre_token_whatsapp
WHATSAPP_PHONE_NUMBER_ID=votre_phone_number_id
ADMIN_PHONE=237676463725

# Telegram Bot Configuration
TG_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TG_CHAT_ID=123456789
```
