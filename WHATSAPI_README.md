# API WhatsApp Relance Zendo

## Configuration

Ajouter dans votre fichier `.env`:
```
WHATSAPP_API_KEY=votre_cle_secrete_whatsapp
```

## Endpoints

### POST /api/whatsapp/relance

Génère et envoie des messages de relance WhatsApp aux clients en attente.

**Headers:**
- Content-Type: application/json

**Body:**
```json
{
  "apiKey": "votre_cle_secrete_whatsapp"
}
```

**Response:**
```json
{
  "success": true,
  "message": "X messages de relance générés",
  "data": {
    "totalOrders": 15,
    "messages": [
      {
        "to": "+237690123456",
        "message": "Salut Jean! 😊\n\nTon panier t'attend: 25 000 FCFA\nProduits: Hismile\nJours en attente: 2\n\n🎁 Promo spéciale: 10% off avec code RELANCE10FCFA\n\nClique ici pour finaliser vite hein! 👇\nhttps://zendo.cm/panier/abc123\n\nBesoin d'aide? Appelle-nous: +237676463725\n\nZendo - Livraison partout au Cameroun 🇨🇲",
        "orderId": "507f1f77bcf86cd799439011",
        "customerName": "Jean",
        "daysWaiting": 2,
        "promoCode": "RELANCE10FCFA",
        "amount": "25 000 FCFA"
      }
    ],
    "generatedAt": "2026-02-02T17:00:00.000Z"
  }
}
```

### GET /api/whatsapp/stats

Statistiques des commandes en attente pour les relances.

**Query Parameters:**
- apiKey: votre_cle_secrete_whatsapp

**Response:**
```json
{
  "success": true,
  "data": {
    "totalWaiting": 25,
    "waiting1Day": 8,
    "waiting3Days": 12,
    "waitingMore3Days": 5,
    "eligibleForRelance": 25,
    "promo10Percent": 8,
    "promo15Percent": 17,
    "statsAt": "2026-02-02T17:00:00.000Z"
  }
}
```

## Logique des Promotions

- **J+1 (24h)**: Code `RELANCE10FCFA` - 10% de réduction
- **J+3 (72h+)**: Code `FLASH15FCFA` - 15% de réduction

## Format des Messages

Les messages sont générés avec:
- Ton camerounais authentique ("mon frère", "vite hein")
- Limite de 160 caractères pour WhatsApp
- Emoji appropriés
- Lien direct vers le panier
- Numéro de support

## Intégration

Pour intégrer avec votre service WhatsApp (respond.io, WAGHL, etc.):

1. Appeler `/api/whatsapp/relance` via webhook ou cron job
2. Envoyer chaque message via votre API WhatsApp
3. Traiter les réponses des clients

**Exemple d'intégration:**
```javascript
const response = await fetch('https://votre-api.com/api/whatsapp/relance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ apiKey: process.env.WHATSAPP_API_KEY })
});

const data = await response.json();

// Envoyer via votre service WhatsApp
for (const msg of data.data.messages) {
  await sendWhatsAppMessage(msg.to, msg.message);
}
```
