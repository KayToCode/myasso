# 📤 Guide pour Pousser le Projet sur GitHub

## 🎯 Étapes pour Mettre en Ligne le Projet

### Étape 1 : Créer un Repository sur GitHub

1. **Aller sur GitHub** : [https://github.com](https://github.com)
2. **Cliquer sur le bouton "+"** en haut à droite → **"New repository"**
3. **Remplir les informations** :
   - **Repository name** : `MyAsso-Kubernetes` (ou le nom de votre choix)
   - **Description** : "Application web Node.js avec MySQL déployée sur Kubernetes"
   - **Visibilité** : 
     - ✅ **Public** (pour partager avec le monde)
     - ✅ **Private** (pour garder privé)
   - **⚠️ IMPORTANT** : **Ne cochez PAS** "Add a README file", "Add .gitignore", ou "Choose a license" (car vous les avez déjà localement)
4. **Cliquer sur "Create repository"**

### Étape 2 : Connecter le Repository Local à GitHub

**Option A : Via HTTPS (Recommandé pour débutants)**

```bash
# Remplacez <votre-username> et <nom-du-repo> par vos valeurs
git remote add origin https://github.com/<votre-username>/<nom-du-repo>.git

# Exemple :
# git remote add origin https://github.com/VotreNom/MyAsso-Kubernetes.git
```

**Option B : Via SSH (Si vous avez configuré SSH)**

```bash
git remote add origin git@github.com:<votre-username>/<nom-du-repo>.git
```

### Étape 3 : Vérifier le Remote

```bash
git remote -v
```

Vous devriez voir :
```
origin  https://github.com/<votre-username>/<nom-du-repo>.git (fetch)
origin  https://github.com/<votre-username>/<nom-du-repo>.git (push)
```

### Étape 4 : Pousser le Code sur GitHub

**Pour la première fois :**

```bash
# Pousser le code sur la branche master
git push -u origin master
```

Si votre repository GitHub utilise `main` au lieu de `master` :

```bash
# Renommer la branche locale
git branch -M main

# Pousser sur main
git push -u origin main
```

**Pour les fois suivantes :**

```bash
git add .
git commit -m "Description de vos modifications"
git push
```

### Étape 5 : Vérifier sur GitHub

1. **Rafraîchir votre page GitHub**
2. **Vérifier** que tous les fichiers sont présents
3. **Vérifier** que le README.md s'affiche correctement

---

## 🔐 Authentification GitHub

### Si vous utilisez HTTPS :

**Option 1 : Token Personnel (Recommandé)**

1. **Créer un token** :
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Cliquer "Generate new token (classic)"
   - Sélectionner les permissions : `repo` (toutes)
   - Copier le token (vous ne pourrez plus le voir !)

2. **Lors du push** :
   - Username : votre nom d'utilisateur GitHub
   - Password : collez le token (pas votre mot de passe GitHub)

**Option 2 : GitHub CLI**

```bash
# Installer GitHub CLI
# Windows (avec Chocolatey)
choco install gh

# Se connecter
gh auth login

# Pousser le code
git push
```

**Option 3 : Credential Manager**

```bash
# Windows stockera automatiquement vos identifiants
git config --global credential.helper wincred
```

### Si vous utilisez SSH :

1. **Générer une clé SSH** (si vous n'en avez pas) :
```bash
ssh-keygen -t ed25519 -C "votre_email@example.com"
```

2. **Ajouter la clé à GitHub** :
   - GitHub → Settings → SSH and GPG keys → New SSH key
   - Copier le contenu de `~/.ssh/id_ed25519.pub`
   - Coller dans GitHub

3. **Tester la connexion** :
```bash
ssh -T git@github.com
```

---

## 📋 Résumé des Commandes

```bash
# 1. Vérifier l'état
git status

# 2. Ajouter tous les fichiers modifiés
git add .

# 3. Créer un commit
git commit -m "Description des modifications"

# 4. Ajouter le remote (une seule fois)
git remote add origin https://github.com/<username>/<repo>.git

# 5. Pousser sur GitHub
git push -u origin master
# ou
git push -u origin main

# Pour les commits suivants
git add .
git commit -m "Nouvelle fonctionnalité"
git push
```

---

## ⚠️ Notes Importantes

### Fichiers à NE PAS Pousser

Assurez-vous que votre `.gitignore` contient :
- `node_modules/`
- `.env`
- `*.log`

Vérifier :
```bash
git status
```

Si des fichiers sensibles apparaissent, ajoutez-les au `.gitignore`.

### Secrets Kubernetes

⚠️ **Attention** : Le fichier `k8s/secret.yaml` est actuellement dans le repo avec des mots de passe de test. 

**Pour la production** :
1. Ne commitez pas les vrais secrets
2. Utilisez des secrets externes (HashiCorp Vault, AWS Secrets Manager, etc.)
3. Ou utilisez `.gitignore` pour exclure `k8s/secret.yaml` :

```bash
# Ajouter à .gitignore
echo "k8s/secret.yaml" >> .gitignore

# Supprimer du cache Git
git rm --cached k8s/secret.yaml

# Commiter
git add .gitignore
git commit -m "Exclure secrets du repo"
```

---

## 🔄 Commandes Utiles pour la Suite

### Voir les Remotes
```bash
git remote -v
```

### Changer l'URL du Remote
```bash
git remote set-url origin https://github.com/nouveau-user/nouveau-repo.git
```

### Supprimer le Remote
```bash
git remote remove origin
```

### Créer une Branche et Pousser
```bash
git checkout -b feature/ma-nouvelle-fonctionnalite
git push -u origin feature/ma-nouvelle-fonctionnalite
```

### Mettre à Jour depuis GitHub
```bash
git pull origin master
# ou
git pull origin main
```

---

## 🎓 Exemple Complet

```bash
# 1. Vérifier l'état actuel
cd D:\MyAsso
git status

# 2. Ajouter tous les fichiers
git add .

# 3. Commiter
git commit -m "Documentation complète ajoutée"

# 4. Créer le repository sur GitHub (via navigateur web)
# https://github.com/new

# 5. Ajouter le remote (remplacez USERNAME et REPO)
git remote add origin https://github.com/USERNAME/REPO.git

# 6. Vérifier le remote
git remote -v

# 7. Pousser le code
git push -u origin master
# Entrer votre username GitHub et token personnel si demandé

# 8. Vérifier sur GitHub.com
```

---

**Bon push sur GitHub ! 🚀**

