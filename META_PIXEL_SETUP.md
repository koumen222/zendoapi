# Configuration Meta Pixel (CAPI) - Backend

## 📋 Variables d'environnement requises

Ajoutez ces variables dans Railway (Settings > Variables) ou dans votre `.env` local :

```env
# Meta Pixel Configuration
META_PIXEL_ID=votre_pixel_id_meta
META_ACCESS_TOKEN=votre_access_token_meta

# Optionnel : Code de test pour valider les événements
META_TEST_EVENT_CODE=votre_code_test
```

## 🔑 Comment obtenir les credentials

### 1. Obtenir le Pixel ID

1. Allez sur [Meta Events Manager](https://business.facebook.com/events_manager2)
2. Sélectionnez votre Pixel
3. Le Pixel ID se trouve dans les paramètres (ex: `123456789012345`)

### 2. Obtenir l'Access Token

1. Allez sur [Meta for Developers](https://developers.facebook.com/)
2. Sélectionnez votre application
3. Allez dans **Settings > Basic**
4. Cliquez sur **Generate Token** dans la section "Access Tokens"
5. Sélectionnez les permissions nécessaires :
   - `ads_management`
   - `business_management`
6. Copiez le token (commence généralement par `EAA...`)

### 3. Obtenir le Test Event Code (optionnel)

1. Dans Events Manager, allez dans **Test Events**
2. Cliquez sur **Create Test Event**
3. Copiez le code de test

## ✅ Vérification de la configuration

### Logs de vérification

Lorsqu'une commande est créée, vous verrez dans les logs Railway :

```
═══════════════════════════════════════════════════════════
📊 META CAPI - Configuration Check
═══════════════════════════════════════════════════════════
🔑 META_PIXEL_ID: 1234...
🔑 META_ACCESS_TOKEN: EAAxxxxxxxx...
```

### Logs d'envoi d'événement

```
═══════════════════════════════════════════════════════════
📊 META CAPI - Purchase Event
═══════════════════════════════════════════════════════════
📦 Order ID: 65a1b2c3d4e5f6g7h8i9j0k1
💰 Value: 9900 XAF
🌐 URL: https://b12068c0.zendof.pages.dev
📍 IP: 192.168.1.1
```

### Succès

```
✅ [META-CAPI] Purchase event sent successfully
📊 [META-CAPI] Response: {
  events_received: 1,
  messages: []
}
```

## ❌ Dépannage

### Erreur : "Missing META_PIXEL_ID or META_ACCESS_TOKEN"

**Solution :**
- Vérifiez que les variables sont bien définies dans Railway
- Redémarrez le service après avoir ajouté les variables
- Vérifiez l'orthographe exacte des noms de variables

### Erreur 400 : "Invalid pixel ID"

**Solution :**
- Vérifiez que le Pixel ID est correct (format numérique)
- Assurez-vous que le pixel existe dans votre compte Meta

### Erreur 401 : "Invalid access token"

**Solution :**
- Régénérez l'access token dans Meta for Developers
- Vérifiez que le token n'a pas expiré
- Assurez-vous que le token a les permissions nécessaires

### Erreur : "Request timeout"

**Solution :**
- Le timeout est de 10 secondes
- Vérifiez votre connexion réseau
- L'événement sera quand même enregistré côté Meta (non-bloquant)

## 📊 Événements envoyés

### Purchase Event

Lorsqu'une commande est créée, le backend envoie automatiquement :

- **Event Name:** `Purchase`
- **Value:** Prix de la commande en XAF
- **Currency:** `XAF`
- **Content Name:** `Hismile Serum`
- **Content IDs:** `['hismile_serum']`
- **Content Category:** `Beauty & Health`
- **Order ID:** ID MongoDB de la commande

## 🔍 Vérifier les événements dans Meta

1. Allez dans [Events Manager](https://business.facebook.com/events_manager2)
2. Sélectionnez votre Pixel
3. Allez dans **Test Events** (si vous utilisez un test code)
4. Ou allez dans **Overview** pour voir les événements en production

## 📝 Notes importantes

- ⚠️ Les erreurs Meta CAPI sont **non-bloquantes** : la commande sera créée même si l'envoi échoue
- ✅ Les logs détaillés permettent de déboguer facilement
- 🔒 L'access token doit être gardé secret (ne jamais le commiter)
- 🧪 Utilisez `META_TEST_EVENT_CODE` en développement pour tester sans affecter les données de production
