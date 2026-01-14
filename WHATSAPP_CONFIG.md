# Configuration WhatsApp - Informations actuelles

## Configuration actuelle

### Numéro qui ENVOIE (WhatsApp Business)
- **Numéro de test** : `+1 555 190 7419`
- **Phone Number ID** : `913249341870874`
- **WhatsApp Business Account ID** : `863878739557487`

### Numéro qui REÇOIT (Admin)
- **Numéro admin** : `+237 6 76 46 37 25`
- **Format pour API** : `237676463725` (sans + et sans espaces)

## Variables `.env` requises

```env
# WhatsApp Cloud API Configuration
WHATSAPP_ACCESS_TOKEN=votre_token_d_acces_whatsapp_business
WHATSAPP_PHONE_NUMBER_ID=913249341870874
ADMIN_PHONE=237676463725
```

## Étape 2 : Envoyer des messages par API

### Vérification de la configuration

1. **Vérifiez que le numéro de réception est autorisé** :
   - Allez dans votre dashboard Meta
   - WhatsApp > API Setup
   - Section "To" ou "Recipient phone numbers"
   - Ajoutez `237676463725` si ce n'est pas déjà fait

2. **Testez l'envoi** :
   - Créez une commande via le formulaire
   - Vérifiez les logs dans le terminal
   - Le message devrait être envoyé de `+1 555 190 7419` vers `+237 6 76 46 37 25`

### Format de l'API

L'API WhatsApp utilise cette structure :
```
POST https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages
```

Avec votre configuration :
```
POST https://graph.facebook.com/v18.0/913249341870874/messages
```

### Payload de la requête

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "237676463725",
  "type": "text",
  "text": {
    "preview_url": false,
    "body": "🛒 NOUVELLE COMMANDE\n\n👤 Nom: ..."
  }
}
```

## Dépannage

### Erreur 131030 : "Recipient phone number not in allowed list"
- **Solution** : Ajoutez `237676463725` dans la liste des destinataires autorisés
- Dashboard Meta > WhatsApp > API Setup > Manage phone number list

### Vérifier que le message part bien
- Regardez les logs dans le terminal
- Vous devriez voir : `✅ MESSAGE WHATSAPP ENVOYÉ AVEC SUCCÈS`
- Le Message ID sera affiché

## Test manuel

Pour tester manuellement l'API, utilisez curl :

```bash
curl -X POST "https://graph.facebook.com/v18.0/913249341870874/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "237676463725",
    "type": "text",
    "text": {
      "preview_url": false,
      "body": "Test message"
    }
  }'
```
