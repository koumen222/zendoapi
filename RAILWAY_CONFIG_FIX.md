# 🔧 Configuration Railway - Solution au problème de build

## ❌ Problème

Railway essaie d'exécuter `npm run build` depuis la racine, ce qui échoue car Vite n'est pas installé (frontend non nécessaire pour le backend).

## ✅ Solution

### Option 1 : Configuration dans l'interface Railway (RECOMMANDÉ)

1. **Allez dans Settings de votre service Railway**
2. **Section "Source"** :
   - **Root Directory** : `server` ⚠️ **OBLIGATOIRE**
3. **Section "Build"** :
   - **Build Command** : Laissez **VIDE** ou supprimez complètement
4. **Section "Deploy"** :
   - **Start Command** : `npm start`

### Option 2 : Vérifier les fichiers de configuration

Les fichiers suivants sont déjà créés dans la branche `backend` :

- ✅ `server/nixpacks.toml` - Désactive le build automatique
- ✅ `server/Procfile` - Définit la commande de démarrage
- ✅ `server/railway.json` - Configuration Railway
- ✅ `.railwayignore` - Ignore le package.json racine

### Option 3 : Si le problème persiste

Si Railway continue à utiliser le `package.json` racine :

1. **Supprimez le service Railway actuel**
2. **Créez un nouveau service**
3. **Sélectionnez "Empty Service"**
4. **Dans Settings → Source → Root Directory** : `server`
5. **Dans Settings → Build → Build Command** : (vide)
6. **Dans Settings → Deploy → Start Command** : `npm start`

## 📋 Checklist de configuration Railway

- [ ] Root Directory = `server` (dans Settings → Source)
- [ ] Build Command = **VIDE** (dans Settings → Build)
- [ ] Start Command = `npm start` (dans Settings → Deploy)
- [ ] Variables d'environnement configurées
- [ ] MongoDB Atlas autorise les connexions Railway

## 🔍 Vérification

Après configuration, les logs Railway devraient montrer :

```
✅ Installation des dépendances depuis server/package.json
✅ Pas de build (cmds = [])
✅ Démarrage avec: npm start
✅ MongoDB connecté
🚀 Server running on port [PORT]
```

## ⚠️ Important

**Le Root Directory = `server` est CRUCIAL**. Sans cela, Railway utilisera le `package.json` racine qui contient le script `build` pour le frontend.
