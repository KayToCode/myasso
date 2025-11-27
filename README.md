# 🚀 MyAsso - Application Web avec Base de Données sur Kubernetes

**Plateforme de gestion des associations et bénévoles déployée sur Kubernetes**

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Structure du Projet](#structure-du-projet)
3. [Comment ça fonctionne](#comment-ça-fonctionne)
4. [Prérequis](#prérequis)
5. [Comment lancer le projet](#comment-lancer-le-projet)
6. [Dépannage](#dépannage)

---

## 🎯 Vue d'ensemble

### Description

MyAsso est une application web qui permet aux associations locales de gérer leurs événements et de coordonner leurs bénévoles. L'application est déployée sur Kubernetes avec :
- **Backend** : Node.js avec Express.js
- **Base de données** : MySQL 8.0
- **Frontend** : HTML, CSS, JavaScript (pur)
- **Containerisation** : Docker
- **Orchestration** : Kubernetes

### Architecture

```
┌─────────────────────────────────────────┐
│      Cluster Kubernetes (Minikube)      │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  MySQL Pod                        │  │
│  │  - Base de données                │  │
│  │  - Volume persistant (PVC)        │  │
│  └──────────────┬────────────────────┘  │
│                 │                        │
│                 │ Service ClusterIP      │
│                 │ (communication interne)│
│                 │                        │
│  ┌──────────────▼────────────────────┐  │
│  │  Backend Pods (Node.js) x2        │  │
│  │  - API REST                       │  │
│  │  - Frontend servit statiquement   │  │
│  └──────────────┬────────────────────┘  │
└─────────────────┼────────────────────────┘
                  │
                  │ Service NodePort
                  │ Port 30080
                  ▼
           http://localhost:30080
```

### Flux de Données

1. **Utilisateur** → Accède à l'application via le port 30080
2. **Service NodePort** → Route vers un Pod backend disponible
3. **Backend Pod** → Traite la requête (API ou fichier statique)
4. **Si besoin de données** → Backend se connecte à MySQL via le Service ClusterIP
5. **MySQL Pod** → Lit/écrit dans le volume persistant

---

## 📁 Structure du Projet

```
MyAsso/
│
├── Dockerfile                    # Image Docker du backend (inclut frontend)
│
├── backend/                      # Code source Node.js
│   ├── config/
│   │   ├── database.js          # Configuration MySQL
│   │   └── database.sql         # Schéma SQL (tables, etc.)
│   ├── routes/                  # Routes API (auth, events, etc.)
│   ├── services/                # Logique métier (assignation auto)
│   ├── middleware/              # Authentification JWT
│   ├── server.js               # Serveur Express
│   └── package.json            # Dépendances Node.js
│
├── frontend/                    # Interface utilisateur
│   ├── css/style.css           # Styles
│   ├── js/                     # JavaScript (API calls, etc.)
│   └── *.html                  # Pages HTML
│
└── k8s/                         # Configuration Kubernetes
    ├── secret.yaml             # Mots de passe (MySQL, JWT)
    ├── configmap.yaml          # Configuration (ports, noms)
    ├── configmap-init-db.yaml  # Script SQL d'initialisation
    ├── persistentvolumeclaim.yaml  # Volume pour MySQL (persistance)
    ├── deployment-mysql.yaml   # Pod MySQL
    ├── deployment-backend.yaml # Pods Node.js (2 répliques)
    ├── service-db.yaml         # Service ClusterIP (MySQL)
    └── service-backend.yaml    # Service NodePort (Backend)
```

---

## 🔧 Comment ça fonctionne

### Composants Kubernetes

#### 1. **MySQL Pod** (`deployment-mysql.yaml`)
- Conteneur MySQL 8.0
- Montage d'un volume persistant (PVC) pour sauvegarder les données
- Script d'initialisation SQL au démarrage (via ConfigMap)
- Health checks (vérifie que MySQL répond)

#### 2. **Backend Pods** (`deployment-backend.yaml`)
- Conteneur Node.js avec l'application
- 2 répliques pour la disponibilité
- Init container qui attend que MySQL soit prêt
- Health checks (vérifie l'endpoint `/api/health`)
- Variables d'environnement depuis Secrets et ConfigMaps

#### 3. **Services**
- **mysql-service** (ClusterIP) : Communication interne uniquement
  - Le backend se connecte via `mysql-service:3306`
- **backend-service** (NodePort) : Exposition externe
  - Accessible sur le port 30080 de tous les nœuds

#### 4. **Secrets** (`secret.yaml`)
- Mots de passe MySQL (root et utilisateur)
- Clé secrète JWT pour l'authentification
- **⚠️ À modifier avant déploiement !**

#### 5. **ConfigMaps**
- `configmap.yaml` : Configuration non sensible (ports, noms de BDD)
- `configmap-init-db.yaml` : Script SQL pour créer les tables

#### 6. **PersistentVolumeClaim** (`persistentvolumeclaim.yaml`)
- Volume de 10Gi pour MySQL
- Les données persistent même si le Pod MySQL redémarre

### Fonctionnalités de l'Application

- ✅ **Associations** : Créer un compte, gérer son profil
- ✅ **Bénévoles** : S'inscrire, rejoindre des associations
- ✅ **Événements** : Créer des événements avec créneaux horaires
- ✅ **Disponibilités** : Indiquer sa disponibilité (Disponible/Peut-être/Pas disponible)
- ✅ **Assignation automatique** : Algorithme qui assigne les bénévoles intelligemment
- ✅ **Notifications** : Notifier les bénévoles de leurs assignations
- ✅ **Annonces** : Système d'annonces pour communiquer

---

## 📦 Prérequis

### Logiciels Requis

1. **Docker Desktop**
   - Téléchargement : https://www.docker.com/products/docker-desktop
   - Vérification : `docker --version`

2. **Minikube**
   - Installation Windows : `choco install minikube`
   - Ou : https://minikube.sigs.k8s.io/docs/start/
   - Vérification : `minikube version`

3. **kubectl**
   - Installation : https://kubernetes.io/docs/tasks/tools/
   - Ou : `choco install kubernetes-cli`
   - Vérification : `kubectl version --client`

### Vérification de l'Environnement

```powershell
# Vérifier Docker
docker --version

# Vérifier Minikube
minikube version

# Vérifier kubectl
kubectl version --client
```

---

## 🚀 Guide d'Installation et de Déploiement

**📝 Ce guide explique comment déployer l'application manuellement avec Kubernetes, sans utiliser de scripts**

---

## 🆕 Installation Complète (Première Fois)

**⏱️ Temps estimé : 15-20 minutes**

### Étape 1 : Préparation de l'Environnement

#### 1.1. Démarrer Docker Desktop
- Ouvrez **Docker Desktop** sur votre machine
- Attendez que Docker soit complètement démarré (icône Docker dans la barre des tâches)

#### 1.2. Démarrer Minikube
```powershell
# Démarrer le cluster Kubernetes local
minikube start

# Vérifier que Minikube est bien démarré
minikube status
```

**Résultat attendu** : Tous les composants doivent être en état "Running"

#### 1.3. Configurer l'Environnement Docker pour Minikube
```powershell
# ⚠️ IMPORTANT : Cette commande configure Docker pour utiliser l'environnement Minikube
# Cela permet de construire des images Docker accessibles par Minikube
minikube docker-env | Invoke-Expression

# Vérifier que Docker est bien configuré
docker ps
```

**💡 Note** : Si vous ouvrez un nouveau terminal PowerShell, vous devrez réexécuter cette commande.

---

### Étape 2 : Construction de l'Image Docker

#### 2.1. Naviguer vers la Racine du Projet
```powershell
# Remplacez le chemin par le chemin de votre projet
cd D:\MyAsso
# ou
cd C:\Users\VotreNom\MyAsso
```

#### 2.2. Construire l'Image Docker
```powershell
# Construire l'image Docker du backend
# Le Dockerfile à la racine du projet sera utilisé
docker build -t myasso-backend:latest .

# Vérifier que l'image a été créée
docker images | Select-String "myasso-backend"
```

**Résultat attendu** : Vous devriez voir `myasso-backend` avec le tag `latest` dans la liste des images.

**⏱️ Temps** : 2-5 minutes (selon votre connexion internet pour télécharger l'image Node.js de base)

---

### Étape 3 : Configuration des Secrets

#### 3.1. Modifier le Fichier de Secrets
**⚠️ OBLIGATOIRE** : Avant de déployer, vous devez modifier les secrets pour la sécurité.

1. Ouvrez le fichier `k8s/secret.yaml` avec un éditeur de texte (Notepad++, VS Code, etc.)

2. Modifiez les valeurs suivantes :

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: myasso-secrets
  namespace: default
type: Opaque
stringData:
  # ⚠️ CHANGEZ CES VALEURS !
  mysql-root-password: VOTRE_MOT_DE_PASSE_ROOT_SECURISE
  mysql-password: VOTRE_MOT_DE_PASSE_USER_SECURISE
  jwt-secret: VOTRE_CLE_SECRETE_JWT_TRES_LONGUE_ET_SECURISEE
```

**Exemple de valeurs sécurisées** :
```yaml
stringData:
  mysql-root-password: RootPass123!@#
  mysql-password: UserPass456!@#
  jwt-secret: ma_cle_secrete_jwt_super_longue_pour_la_securite_2024_avec_des_caracteres_speciaux_!@#
```

3. **💾 Sauvegardez le fichier** après modification.

**💡 Note** : Ces secrets seront utilisés pour :
- `mysql-root-password` : Mot de passe administrateur MySQL
- `mysql-password` : Mot de passe de l'utilisateur MySQL de l'application
- `jwt-secret` : Clé secrète pour signer les tokens JWT d'authentification

---

### Étape 4 : Déploiement des Ressources Kubernetes

**📋 Ordre de déploiement** : Les ressources doivent être déployées dans un ordre spécifique pour que les dépendances soient respectées.

#### 4.1. Naviguer vers le Dossier Kubernetes
```powershell
cd k8s
```

#### 4.2. Déployer les Secrets
```powershell
# Créer les secrets (mots de passe MySQL, clé JWT)
kubectl apply -f secret.yaml

# Vérifier que les secrets ont été créés
kubectl get secrets
```

**Résultat attendu** : Vous devriez voir `myasso-secrets` dans la liste.

#### 4.3. Déployer les ConfigMaps
```powershell
# Créer les ConfigMaps (configuration non sensible)
kubectl apply -f configmap.yaml
kubectl apply -f configmap-init-db.yaml

# Vérifier que les ConfigMaps ont été créés
kubectl get configmaps
```

**Résultat attendu** : Vous devriez voir `myasso-config` et `mysql-init-script` dans la liste.

**💡 Explication** :
- `configmap.yaml` : Contient la configuration de l'application (ports, noms de base de données, etc.)
- `configmap-init-db.yaml` : Contient le script SQL d'initialisation qui crée toutes les tables

#### 4.4. Créer le Volume Persistant (PVC)
```powershell
# Créer le PersistentVolumeClaim pour MySQL
# Ce volume permet de conserver les données même si le Pod MySQL redémarre
kubectl apply -f persistentvolumeclaim.yaml

# Vérifier que le PVC a été créé et est lié (Bound)
kubectl get pvc
```

**Résultat attendu** : Le statut doit être `Bound` (cela peut prendre quelques secondes).

**💡 Explication** : Le PVC réserve 10Gi d'espace de stockage pour MySQL. Les données seront persistantes même après redémarrage.

#### 4.5. Déployer MySQL
```powershell
# Déployer le Pod MySQL
kubectl apply -f deployment-mysql.yaml

# Créer le Service MySQL (communication interne)
kubectl apply -f service-db.yaml

# Vérifier que MySQL démarre
kubectl get pods -l app=mysql
```

**Résultat attendu** : Le Pod MySQL devrait être en état `Running` après 30-60 secondes.

**💡 Explication** :
- `deployment-mysql.yaml` : Définit le Pod MySQL avec ses configurations (image, variables d'environnement, volumes)
- `service-db.yaml` : Crée un service ClusterIP qui permet au backend de se connecter à MySQL via le nom `mysql-service`

#### 4.6. Attendre que MySQL soit Prêt
```powershell
# Attendre que MySQL soit complètement démarré et prêt
# Cette commande attend jusqu'à 2 minutes que le Pod soit en état "Ready"
kubectl wait --for=condition=ready pod -l app=mysql --timeout=120s

# Vérifier les logs de MySQL pour s'assurer qu'il a bien démarré
kubectl logs -l app=mysql --tail=20
```

**Résultat attendu** : Vous devriez voir des messages indiquant que MySQL a démarré et que la base de données a été initialisée.

**⏱️ Temps** : 30-60 secondes

**💡 Important - Initialisation de la Base de Données** :
- Le script SQL dans `configmap-init-db.yaml` est exécuté **automatiquement au premier démarrage de MySQL**
- Le script crée toutes les tables nécessaires (`associations`, `benevoles`, `evenements`, etc.)
- **Cette initialisation n'a lieu qu'une seule fois** car MySQL ne réexécute les scripts de `/docker-entrypoint-initdb.d/` que si le répertoire `/var/lib/mysql` est vide
- Grâce au PVC (PersistentVolumeClaim), les données sont conservées entre les redémarrages, donc le script ne sera **PAS réexécuté** lors des prochains déploiements

#### 4.7. Déployer le Backend
```powershell
# Déployer les Pods Backend (2 répliques pour la haute disponibilité)
kubectl apply -f deployment-backend.yaml

# Créer le Service Backend (exposition externe)
kubectl apply -f service-backend.yaml

# Vérifier que les Pods Backend démarrent
kubectl get pods -l app=backend
```

**Résultat attendu** : Vous devriez voir 2 Pods backend qui passent progressivement à l'état `Running`.

**💡 Explication** :
- `deployment-backend.yaml` : Définit les Pods Node.js avec votre application (2 répliques)
- `service-backend.yaml` : Crée un service NodePort qui expose l'application sur le port 30080

**⏱️ Temps** : 30-60 secondes pour que les Pods démarrent complètement

---

### Étape 5 : Vérification du Déploiement

#### 5.1. Vérifier l'État des Pods
```powershell
# Voir tous les Pods et leur état
kubectl get pods

# Résultat attendu :
# NAME                                  READY   STATUS    RESTARTS   AGE
# backend-deployment-xxxxx-xxxxx       1/1     Running   0          30s
# backend-deployment-xxxxx-xxxxx       1/1     Running   0          30s
# mysql-deployment-xxxxx-xxxxx         1/1     Running   0          2m
```

**✅ Tous les Pods doivent être en état `Running` et `READY 1/1`**

#### 5.2. Vérifier les Services
```powershell
# Voir tous les Services
kubectl get services

# Résultat attendu :
# NAME              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
# backend-service   NodePort    10.96.xxx.xxx    <none>        3000:30080/TCP   30s
# mysql-service     ClusterIP   10.96.xxx.xxx   <none>        3306/TCP         2m
```

**✅ Les deux services doivent être présents**

#### 5.3. Vérifier les Logs (Optionnel)
```powershell
# Voir les logs du backend pour vérifier qu'il démarre correctement
kubectl logs -l app=backend --tail=30

# Voir les logs de MySQL
kubectl logs -l app=mysql --tail=30
```

**✅ Vous devriez voir des messages indiquant que les services ont démarré correctement**

---

### Étape 6 : Accéder à l'Application

#### 6.1. Méthode 1 : Via Minikube Service (Recommandé)
```powershell
# Cette commande ouvre automatiquement votre navigateur
minikube service backend-service
```

**Résultat** : Votre navigateur s'ouvre automatiquement sur l'URL de l'application.

#### 6.2. Méthode 2 : Via Port-Forward
```powershell
# Dans un terminal PowerShell, exécutez :
kubectl port-forward service/backend-service 3000:3000

# Puis ouvrez votre navigateur sur : http://localhost:3000
```

**💡 Note** : Gardez ce terminal ouvert pendant que vous utilisez l'application.

#### 6.3. Méthode 3 : Via NodePort Directement
```powershell
# Obtenir l'IP de Minikube
minikube ip

# Puis accéder à : http://<IP_MINIKUBE>:30080
# Exemple : http://192.168.49.2:30080
```

---

## 🔄 Réactivation Rapide (Déjà Installé)

**⏱️ Temps estimé : 2-3 minutes**

Si vous avez déjà déployé l'application précédemment et que vous voulez simplement la relancer :

### Option A : Minikube est Arrêté

```powershell
# 1. Démarrer Minikube
minikube start

# 2. Configurer l'environnement Docker
minikube docker-env | Invoke-Expression

# 3. Attendre que les Pods redémarrent automatiquement (30-60 secondes)
# Kubernetes relance automatiquement les Pods selon les Deployments existants
Start-Sleep -Seconds 30

# 4. Vérifier que tout est prêt
kubectl get pods

# 5. Accéder à l'application
minikube service backend-service
```

**💡 Explication** : Quand vous faites `minikube start`, Kubernetes lit automatiquement les ressources existantes (Deployments, Services, etc.) et relance les Pods selon ces définitions.

### Option B : Minikube est Déjà Démarré

```powershell
# 1. Vérifier l'état de Minikube
minikube status

# 2. Vérifier que les Pods sont en cours d'exécution
kubectl get pods

# 3. Si tous les Pods sont "Running", accéder directement
minikube service backend-service

# 4. Si certains Pods ne sont pas prêts, attendre puis réessayer
Start-Sleep -Seconds 30
kubectl get pods
minikube service backend-service
```

---

### 🔍 VÉRIFICATIONS UTILES

```powershell
# Vérifier l'état de Minikube
minikube status

# Vérifier les Pods (doivent être tous "Running" et "1/1")
kubectl get pods

# Vérifier les Services
kubectl get services

# Vérifier le PVC (volume persistant)
kubectl get pvc

# Voir les logs du backend
kubectl logs -l app=backend --tail=50

# Voir les logs de MySQL
kubectl logs -l app=mysql --tail=50
```

---

### 🔧 EN CAS DE PROBLÈME

```powershell
# Si les Pods backend ne démarrent pas, reconstruire l'image
cd D:\MyAsso
minikube docker-env | Invoke-Expression
docker build -t myasso-backend:latest .

# Redémarrer les Pods backend
kubectl delete pods -l app=backend

# Attendre le redémarrage
Start-Sleep -Seconds 30
kubectl get pods
```

---

## 📖 Guide Détaillé

**📝 Si vous avez besoin de plus de détails, consultez les sections ci-dessous**

---

### 🆕 Première Installation (Première fois)

**⏱️ Temps estimé : 10-15 minutes**

Si c'est la première fois que vous lancez le projet, suivez toutes ces étapes :

#### Étape 1 : Vérifier les Prérequis

```powershell
# Vérifier que Docker Desktop est installé et démarré
docker --version

# Vérifier que Minikube est installé
minikube version

# Vérifier que kubectl est installé
kubectl version --client
```

#### Étape 2 : Démarrer Minikube

```powershell
# Démarrer Minikube (première fois, cela peut prendre 2-3 minutes)
minikube start

# Vérifier que Minikube est bien démarré
minikube status
```

**Résultat attendu** : Tous les composants doivent être en "Running".

#### Étape 3 : Activer l'Environnement Docker de Minikube

**⚠️ IMPORTANT** : Cette étape est cruciale ! Elle permet de construire l'image Docker dans l'environnement de Minikube.

```powershell
# Activer l'environnement Docker de Minikube
minikube docker-env | Invoke-Expression

# Vérifier que Docker utilise maintenant Minikube
docker ps
```

**💡 Note** : Si vous ouvrez un nouveau terminal PowerShell, vous devrez réexécuter cette commande.

#### Étape 4 : Construire l'Image Docker

```powershell
# Aller à la racine du projet
cd D:\MyAsso

# Construire l'image Docker (cela peut prendre 2-3 minutes la première fois)
docker build -t myasso-backend:latest .

# Vérifier que l'image est créée
docker images | Select-String "myasso-backend"
```

**Résultat attendu** : Vous devriez voir `myasso-backend` dans la liste des images Docker.

#### Étape 5 : Modifier les Secrets (OBLIGATOIRE)

**⚠️ NE SAUTEZ PAS CETTE ÉTAPE !**

1. Ouvrez le fichier `k8s/secret.yaml` avec un éditeur de texte (Notepad++, VS Code, etc.)

2. Modifiez les valeurs suivantes :

```yaml
stringData:
  mysql-root-password: VOTRE_MOT_DE_PASSE_ROOT  # Changez-moi !
  mysql-password: VOTRE_MOT_DE_PASSE_USER        # Changez-moi !
  jwt-secret: VOTRE_CLE_SECRETE_JWT_LONGUE        # Changez-moi !
```

**Exemple** :
```yaml
stringData:
  mysql-root-password: MonMotDePasseRoot123
  mysql-password: MonMotDePasseUser123
  jwt-secret: ma_cle_secrete_jwt_super_longue_pour_la_securite_2024
```

3. **💾 Sauvegardez le fichier** après modification.

#### Étape 6 : Déployer sur Kubernetes

Voir la section [Installation Complète](#-installation-complète-première-fois) pour les commandes de déploiement manuel détaillées.

En résumé, déployer dans cet ordre :
```powershell
# Aller dans le dossier k8s
cd k8s

# 1. Créer les Secrets
kubectl apply -f secret.yaml

# 2. Créer les ConfigMaps
kubectl apply -f configmap.yaml
kubectl apply -f configmap-init-db.yaml

# 3. Créer le PVC
kubectl apply -f persistentvolumeclaim.yaml

# 4. Déployer MySQL
kubectl apply -f deployment-mysql.yaml
kubectl apply -f service-db.yaml

# 5. Attendre que MySQL soit prêt
kubectl wait --for=condition=ready pod -l app=mysql --timeout=120s

# 6. Déployer le Backend
kubectl apply -f deployment-backend.yaml
kubectl apply -f service-backend.yaml
```

**⏱️ Temps estimé** : 2-3 minutes

Le script va automatiquement :
1. ✅ Créer les Secrets
2. ✅ Créer les ConfigMaps
3. ✅ Créer le volume persistant (PVC)
4. ✅ Déployer MySQL
5. ✅ Attendre que MySQL soit prêt
6. ✅ Déployer le Backend
7. ✅ Afficher le statut des Pods et Services

#### Étape 7 : Vérifier que Tout Fonctionne

```powershell
# Vérifier les Pods (doivent être en état "Running")
kubectl get pods

# Résultat attendu :
# NAME                                  READY   STATUS    RESTARTS   AGE
# backend-deployment-xxxxx-xxxxx       1/1     Running   0          30s
# backend-deployment-xxxxx-xxxxx       1/1     Running   0          30s
# mysql-deployment-xxxxx-xxxxx         1/1     Running   0          2m
```

#### Étape 8 : Accéder à l'Application

```powershell
# Minikube va ouvrir automatiquement le navigateur
minikube service backend-service
```

**🎉 Félicitations ! Votre application est maintenant accessible !**

---

### 🔄 Réactivation Rapide (Déjà Installé)

**⏱️ Temps estimé : 2-3 minutes**

Si vous avez déjà installé le projet précédemment et que vous voulez simplement le relancer :

#### Option A : Si Minikube est Arrêté

```powershell
# 1. Démarrer Minikube
minikube start

# 2. Activer l'environnement Docker
minikube docker-env | Invoke-Expression

# 3. Vérifier que les Pods redémarrent automatiquement
kubectl get pods

# Si les Pods ne sont pas prêts, attendez 30 secondes puis vérifiez à nouveau
Start-Sleep -Seconds 30
kubectl get pods

# 4. Accéder à l'application
minikube service backend-service
```

**💡 Les Pods redémarrent automatiquement** : Kubernetes redémarrera automatiquement les Pods qui étaient en cours d'exécution avant l'arrêt de Minikube.

**💡 Concernant la base de données** : Le script SQL d'initialisation (`configmap-init-db.yaml`) est exécuté **UNIQUEMENT au premier démarrage de MySQL**. Si vous avez déjà déployé l'application une fois, les données sont stockées dans un volume persistant (PVC). Même si vous redémarrez Minikube ou redéployez le backend, les données existantes sont conservées et le script SQL n'est **PAS réexécuté**.

#### Option B : Si Minikube est Déjà Démarré

```powershell
# 1. Vérifier que Minikube est démarré
minikube status

# 2. Vérifier que les Pods sont en cours d'exécution
kubectl get pods

# Si tous les Pods sont en état "Running", vous pouvez directement accéder à l'application
minikube service backend-service

# Si certains Pods ne sont pas prêts, attendez quelques secondes
Start-Sleep -Seconds 30
kubectl get pods
```

#### Option C : Si les Pods ne Démarrent Pas

```powershell
# 1. Activer l'environnement Docker (au cas où)
minikube docker-env | Invoke-Expression

# 2. Vérifier que l'image existe toujours
docker images | Select-String "myasso-backend"

# 3. Si l'image n'existe pas, la reconstruire
cd D:\MyAsso
docker build -t myasso-backend:latest .

# 4. Redémarrer les Pods backend
kubectl delete pods -l app=backend

# 5. Attendre que les Pods redémarrent (environ 30 secondes)
Start-Sleep -Seconds 30
kubectl get pods

# 6. Accéder à l'application
minikube service backend-service
```

---

### 📋 Résumé Rapide - Commandes à Copier-Coller

#### 🆕 Première Installation Complète

```powershell
# 1. Démarrer Minikube
minikube start

# 2. Activer l'environnement Docker (IMPORTANT !)
minikube docker-env | Invoke-Expression

# 3. Construire l'image Docker
cd D:\MyAsso
docker build -t myasso-backend:latest .

# 4. ⚠️ Modifier k8s/secret.yaml (ouvrir avec un éditeur de texte)
#    Changer les mots de passe : mysql-root-password, mysql-password, jwt-secret

# 5. Déployer sur Kubernetes (voir section Installation Complète pour les détails)
cd k8s
kubectl apply -f secret.yaml
kubectl apply -f configmap.yaml
kubectl apply -f configmap-init-db.yaml
kubectl apply -f persistentvolumeclaim.yaml
kubectl apply -f deployment-mysql.yaml
kubectl apply -f service-db.yaml
kubectl wait --for=condition=ready pod -l app=mysql --timeout=120s
kubectl apply -f deployment-backend.yaml
kubectl apply -f service-backend.yaml

# 6. Accéder à l'application
minikube service backend-service
```

**⏱️ Temps estimé** : 10-15 minutes

#### 🔄 Réactivation Rapide (Déjà Installé)

**Si Minikube est arrêté :**

```powershell
# 1. Démarrer Minikube
minikube start

# 2. Activer l'environnement Docker
minikube docker-env | Invoke-Expression

# 3. Attendre que les Pods redémarrent (30 secondes)
Start-Sleep -Seconds 30

# 4. Vérifier que tout est prêt
kubectl get pods

# 5. Accéder à l'application
minikube service backend-service
```

**Si Minikube est déjà démarré :**

```powershell
# 1. Vérifier que tout fonctionne
kubectl get pods

# 2. Si tous les Pods sont "Running", accéder directement
minikube service backend-service

# 3. Si certains Pods ne sont pas prêts, attendre 30 secondes puis réessayer
Start-Sleep -Seconds 30
kubectl get pods
minikube service backend-service
```

**⏱️ Temps estimé** : 1-2 minutes

---


---

## ⚡ Lancer l'Application Maintenant (Tout est Déjà Créé)

**Vous avez déjà tout installé (PVC, build, déploiement) ? Voici comment lancer rapidement :**

### 📋 Commande Rapide (Copier-Coller)

```powershell
# 1. Démarrer Minikube (si arrêté)
minikube start

# 2. Activer l'environnement Docker
minikube docker-env | Invoke-Expression

# 3. Attendre que les Pods redémarrent (30 secondes)
Start-Sleep -Seconds 30

# 4. Vérifier que tout est prêt
kubectl get pods

# 5. Accéder à l'application
minikube service backend-service
```

**⏱️ Temps total : 1-2 minutes**

### ✅ Vérifier que Tout Fonctionne

```powershell
# Vérifier les Pods (doivent être tous "Running" et "1/1")
kubectl get pods

# Vérifier le PVC (doit être "Bound")
kubectl get pvc

# Vérifier les Services
kubectl get services
```

---

## ❓ Questions Fréquentes sur la Base de Données

### 🔄 Comment fonctionne l'initialisation de la base de données ?

#### À la première installation
Quand vous déployez l'application pour la première fois :

1. Le PVC (PersistentVolumeClaim) est créé - c'est un volume vide de 10Gi
2. MySQL démarre et voit que le volume est vide
3. MySQL exécute automatiquement tous les scripts présents dans `/docker-entrypoint-initdb.d/`
4. Le script `01-init.sql` (depuis `configmap-init-db.yaml`) crée :
   - La base de données `myasso`
   - Toutes les tables nécessaires (associations, benevoles, evenements, etc.)
5. ✅ **La base de données est prête à être utilisée**

#### Lors des déploiements suivants
- Si vous redéployez l'application ou redémarrez Minikube :
  - Le PVC existe toujours avec les données
  - MySQL voit que le volume n'est pas vide
  - ❌ **Le script SQL n'est PAS réexécuté**
  - ✅ **Toutes vos données sont conservées** (utilisateurs, événements, etc.)

### 🔄 Que se passe-t-il si je modifie le script SQL dans `configmap-init-db.yaml` ?

**⚠️ Important** : Modifier le script SQL dans `configmap-init-db.yaml` **ne met pas automatiquement à jour** la base de données existante.

Le script n'est exécuté qu'au premier démarrage. Si vous avez déjà une base de données avec des données :

#### Option 1 : Mettre à jour manuellement (Recommandé pour la production)
Exécuter des migrations SQL manuellement :
```powershell
# Se connecter au Pod MySQL
kubectl exec -it deployment/mysql-deployment -- mysql -uroot -p

# Entrer le mot de passe root (depuis secret.yaml)
# Puis exécuter vos modifications SQL manuellement
USE myasso;
ALTER TABLE ... -- Vos modifications
```

#### Option 2 : Recréer la base de données (⚠️ Supprime toutes les données)
Si vous êtes en développement et voulez repartir de zéro :
```powershell
# ⚠️ ATTENTION : Cela supprime TOUTES les données !
# 1. Supprimer le PVC
kubectl delete pvc mysql-pvc

# 2. Supprimer le Pod MySQL
kubectl delete deployment mysql-deployment

# 3. Appliquer le nouveau ConfigMap avec les modifications
kubectl apply -f k8s/configmap-init-db.yaml

# 4. Recréer le PVC
kubectl apply -f k8s/persistentvolumeclaim.yaml

# 5. Redéployer MySQL (le nouveau script sera exécuté)
kubectl apply -f k8s/deployment-mysql.yaml
kubectl apply -f k8s/service-db.yaml
```

### 🔄 Est-ce que la base de données se met à jour quand je push du code ?

**Non**. Voici comment ça fonctionne :

1. **Le code de l'application** (frontend/backend) : 
   - Quand vous modifiez et poussez le code
   - Vous devez reconstruire l'image Docker : `docker build -t myasso-backend:latest .`
   - Redémarrer les Pods backend : `kubectl rollout restart deployment/backend-deployment`
   - ✅ Les modifications du code sont prises en compte

2. **Le script SQL d'initialisation** :
   - Quand vous modifiez `configmap-init-db.yaml` et poussez
   - Vous devez appliquer le ConfigMap : `kubectl apply -f k8s/configmap-init-db.yaml`
   - ❌ **MAIS** le script ne sera PAS réexécuté car la base existe déjà
   - Les modifications du script ne sont appliquées que si vous recréez la base (Option 2 ci-dessus)

### 💾 Pourquoi la base de données est-elle persistante ?

Grâce au **PersistentVolumeClaim (PVC)** :
- Les données MySQL sont stockées dans un volume persistant de 10Gi
- Ce volume survit aux redémarrages de Pods et de Minikube
- Même si vous supprimez et recréez les Pods MySQL, les données restent
- C'est ce qui permet la persistance des données

### 📝 Résumé Simple

| Situation | Script SQL exécuté ? | Données conservées ? |
|-----------|---------------------|---------------------|
| **Première installation** | ✅ Oui (automatiquement) | ✅ Base créée |
| **Redémarrage Minikube** | ❌ Non | ✅ Oui (toutes les données) |
| **Redéploiement backend** | ❌ Non | ✅ Oui |
| **Redéploiement MySQL** | ❌ Non (volume existe) | ✅ Oui |
| **Modification script SQL** | ❌ Non (base existe) | ✅ Oui (sauf si PVC supprimé) |

---

## 📚 Documentation des Paramètres de Configuration

Cette section explique tous les paramètres de configuration et comment les modifier pour adapter le déploiement à d'autres environnements.

---

### 🔐 Secrets (`k8s/secret.yaml`)

**Fichier** : `k8s/secret.yaml`

Les secrets contiennent des informations sensibles (mots de passe, clés secrètes).

#### Paramètres Configurables

| Paramètre | Description | Exemple | Modification |
|-----------|-------------|---------|--------------|
| `mysql-root-password` | Mot de passe administrateur MySQL | `RootPass123!@#` | ⚠️ **OBLIGATOIRE** : Changez avant le déploiement |
| `mysql-password` | Mot de passe utilisateur MySQL de l'application | `UserPass456!@#` | ⚠️ **OBLIGATOIRE** : Changez avant le déploiement |
| `jwt-secret` | Clé secrète pour signer les tokens JWT | `ma_cle_secrete_longue` | ⚠️ **OBLIGATOIRE** : Changez avant le déploiement |

#### Comment Modifier

1. Ouvrez `k8s/secret.yaml`
2. Modifiez les valeurs dans `stringData`
3. Sauvegardez le fichier
4. Appliquez les modifications : `kubectl apply -f k8s/secret.yaml`
5. Redémarrez les Pods affectés : `kubectl rollout restart deployment/backend-deployment`

**⚠️ Important** : Les secrets sont encodés en base64 dans Kubernetes. Utilisez `stringData` pour une modification facile.

---

### ⚙️ ConfigMap (`k8s/configmap.yaml`)

**Fichier** : `k8s/configmap.yaml`

Les ConfigMaps contiennent des configurations non sensibles.

#### Paramètres Configurables

| Paramètre | Description | Valeur par Défaut | Modification |
|-----------|-------------|-------------------|--------------|
| `mysql-database` | Nom de la base de données | `myasso` | Modifiable selon vos besoins |
| `mysql-user` | Nom d'utilisateur MySQL | `myasso` | Modifiable selon vos besoins |
| `mysql-port` | Port MySQL | `3306` | Standard MySQL, généralement pas besoin de changer |
| `node-env` | Environnement Node.js | `production` | Peut être `development` ou `production` |
| `port` | Port du serveur backend | `3000` | Modifiable si nécessaire |
| `db-host` | Nom du service MySQL | `mysql-service` | ⚠️ Ne changez que si vous renommez le service |
| `db-port` | Port de connexion MySQL | `3306` | Standard MySQL |
| `db-name` | Nom de la base de données (doit correspondre à `mysql-database`) | `myasso` | Modifiable |
| `db-user` | Utilisateur MySQL (doit correspondre à `mysql-user`) | `myasso` | Modifiable |

#### Comment Modifier

1. Ouvrez `k8s/configmap.yaml`
2. Modifiez les valeurs dans `data`
3. Sauvegardez le fichier
4. Appliquez les modifications : `kubectl apply -f k8s/configmap.yaml`
5. Redémarrez les Pods : `kubectl rollout restart deployment/backend-deployment deployment/mysql-deployment`

**💡 Note** : Si vous changez `mysql-database` ou `mysql-user`, assurez-vous que les valeurs correspondent dans toutes les sections.

---

### 🗄️ Script d'Initialisation de la Base de Données (`k8s/configmap-init-db.yaml`)

**Fichier** : `k8s/configmap-init-db.yaml`

Ce fichier contient le script SQL qui crée toutes les tables au **premier démarrage de MySQL uniquement**.

#### Structure

- **Fichier SQL** : `01-init.sql`
- **Exécution** : ⚠️ **Automatique UNIQUEMENT au premier démarrage de MySQL** (quand le volume est vide)
- **Emplacement** : Monté dans `/docker-entrypoint-initdb.d/` du conteneur MySQL
- **Important** : MySQL ne réexécute les scripts que si `/var/lib/mysql` est vide

#### ⚠️ Comportement Important

| Situation | Le script est-il exécuté ? |
|-----------|---------------------------|
| Premier déploiement (volume vide) | ✅ OUI - Toutes les tables sont créées |
| Redémarrage de Minikube | ❌ NON - Les données existent déjà |
| Redéploiement de MySQL | ❌ NON - Le PVC existe avec des données |
| Modification du script + nouveau déploiement | ❌ NON - La base existe déjà |

#### Modifications Possibles

1. **Ajouter des tables** : Ajoutez vos `CREATE TABLE` dans le script
2. **Ajouter des données initiales** : Ajoutez des `INSERT` après les `CREATE TABLE`
3. **Modifier le schéma** : Modifiez les définitions de tables existantes

#### Comment Modifier le Script

1. Ouvrez `k8s/configmap-init-db.yaml`
2. Modifiez le contenu dans `data.01-init.sql`
3. Sauvegardez le fichier
4. Appliquez les modifications : `kubectl apply -f k8s/configmap-init-db.yaml`

**⚠️ IMPORTANT** : Appliquer le ConfigMap modifié **ne réexécute pas** le script sur une base existante !

#### Pour Appliquer les Modifications du Script SQL

**Option 1 : Migration SQL Manuelle (Recommandé pour la production)**
```powershell
# Se connecter au Pod MySQL et exécuter les modifications manuellement
kubectl exec -it deployment/mysql-deployment -- mysql -uroot -p
# Puis exécuter vos ALTER TABLE, CREATE TABLE, etc.
```

**Option 2 : Recréer la Base de Données (⚠️ Supprime TOUTES les données)**
```powershell
# ⚠️ ATTENTION : Cela supprime toutes les données existantes !
# 1. Supprimer le PVC
kubectl delete pvc mysql-pvc

# 2. Supprimer le Pod MySQL
kubectl delete deployment mysql-deployment

# 3. Recréer le PVC (vide)
kubectl apply -f k8s/persistentvolumeclaim.yaml

# 4. Redéployer MySQL (le nouveau script sera exécuté)
kubectl apply -f k8s/deployment-mysql.yaml
kubectl apply -f k8s/service-db.yaml
```

---

### 💾 PersistentVolumeClaim (`k8s/persistentvolumeclaim.yaml`)

**Fichier** : `k8s/persistentvolumeclaim.yaml`

Définit le volume de stockage persistant pour MySQL.

#### Paramètres Configurables

| Paramètre | Description | Valeur par Défaut | Modification |
|-----------|-------------|-------------------|--------------|
| `storage` | Taille du volume | `10Gi` | Modifiable selon vos besoins (ex: `20Gi`, `50Gi`) |
| `accessModes` | Mode d'accès | `ReadWriteOnce` | Standard pour MySQL, généralement pas besoin de changer |

#### Comment Modifier

1. Ouvrez `k8s/persistentvolumeclaim.yaml`
2. Modifiez la valeur de `storage` dans `resources.requests.storage`
3. Sauvegardez le fichier
4. **⚠️ Important** : Pour augmenter la taille, vous devez supprimer et recréer le PVC (cela supprime les données) :
   ```powershell
   # Sauvegarder les données d'abord (optionnel)
   kubectl exec deployment/mysql-deployment -- mysqldump -uroot -p myasso > backup.sql
   
   # Supprimer le PVC
   kubectl delete pvc mysql-pvc
   
   # Appliquer le nouveau PVC
   kubectl apply -f k8s/persistentvolumeclaim.yaml
   
   # Redéployer MySQL
   kubectl apply -f k8s/deployment-mysql.yaml
   ```

---

### 🐬 Déploiement MySQL (`k8s/deployment-mysql.yaml`)

**Fichier** : `k8s/deployment-mysql.yaml`

Définit le Pod MySQL.

#### Paramètres Configurables

| Paramètre | Description | Valeur par Défaut | Modification |
|-----------|-------------|-------------------|--------------|
| `replicas` | Nombre de répliques MySQL | `1` | ⚠️ MySQL ne supporte généralement qu'une seule instance |
| `image` | Image Docker MySQL | `mysql:8.0` | Peut être changé pour une autre version (ex: `mysql:8.1`) |
| `resources.requests.memory` | Mémoire minimale | `512Mi` | Modifiable selon vos ressources |
| `resources.requests.cpu` | CPU minimal | `250m` | Modifiable selon vos ressources |
| `resources.limits.memory` | Mémoire maximale | `1Gi` | Modifiable selon vos ressources |
| `resources.limits.cpu` | CPU maximal | `500m` | Modifiable selon vos ressources |

#### Comment Modifier

1. Ouvrez `k8s/deployment-mysql.yaml`
2. Modifiez les valeurs souhaitées
3. Sauvegardez le fichier
4. Appliquez les modifications : `kubectl apply -f k8s/deployment-mysql.yaml`
5. Kubernetes redéploiera automatiquement le Pod avec les nouvelles configurations

---

### 🚀 Déploiement Backend (`k8s/deployment-backend.yaml`)

**Fichier** : `k8s/deployment-backend.yaml`

Définit les Pods Node.js de l'application.

#### Paramètres Configurables

| Paramètre | Description | Valeur par Défaut | Modification |
|-----------|-------------|-------------------|--------------|
| `replicas` | Nombre de répliques backend | `2` | Modifiable (1 pour développement, 3+ pour production) |
| `image` | Image Docker backend | `myasso-backend:latest` | ⚠️ Ne changez que si vous utilisez un registry |
| `imagePullPolicy` | Politique de pull d'image | `IfNotPresent` | ⚠️ Gardez `IfNotPresent` pour les images locales |
| `resources.requests.memory` | Mémoire minimale | `256Mi` | Modifiable selon vos ressources |
| `resources.requests.cpu` | CPU minimal | `100m` | Modifiable selon vos ressources |
| `resources.limits.memory` | Mémoire maximale | `512Mi` | Modifiable selon vos ressources |
| `resources.limits.cpu` | CPU maximal | `500m` | Modifiable selon vos ressources |

#### Comment Modifier

1. Ouvrez `k8s/deployment-backend.yaml`
2. Modifiez les valeurs souhaitées
3. Sauvegardez le fichier
4. Appliquez les modifications : `kubectl apply -f k8s/deployment-backend.yaml`
5. Kubernetes redéploiera automatiquement les Pods avec les nouvelles configurations

**💡 Exemple** : Pour le développement, vous pouvez réduire à 1 réplique :
```yaml
spec:
  replicas: 1  # Au lieu de 2
```

---

### 🌐 Service Backend (`k8s/service-backend.yaml`)

**Fichier** : `k8s/service-backend.yaml`

Expose l'application backend à l'extérieur du cluster.

#### Paramètres Configurables

| Paramètre | Description | Valeur par Défaut | Modification |
|-----------|-------------|-------------------|--------------|
| `type` | Type de service | `NodePort` | Peut être `ClusterIP` (interne) ou `LoadBalancer` (cloud) |
| `port` | Port du service | `3000` | Modifiable si vous changez le port du backend |
| `targetPort` | Port du conteneur | `3000` | Doit correspondre au port du backend |
| `nodePort` | Port externe | `30080` | Modifiable (doit être entre 30000-32767) |

#### Comment Modifier

1. Ouvrez `k8s/service-backend.yaml`
2. Modifiez les valeurs souhaitées
3. Sauvegardez le fichier
4. Appliquez les modifications : `kubectl apply -f k8s/service-backend.yaml`

**💡 Exemple** : Pour changer le port externe à 30081 :
```yaml
ports:
- port: 3000
  targetPort: 3000
  nodePort: 30081  # Au lieu de 30080
```

---

### 🔗 Service MySQL (`k8s/service-db.yaml`)

**Fichier** : `k8s/service-db.yaml`

Service interne pour la communication avec MySQL.

#### Paramètres Configurables

| Paramètre | Description | Valeur par Défaut | Modification |
|-----------|-------------|-------------------|--------------|
| `type` | Type de service | `ClusterIP` | ⚠️ Ne changez généralement pas (service interne) |
| `port` | Port du service | `3306` | Standard MySQL, généralement pas besoin de changer |
| `targetPort` | Port du conteneur | `3306` | Standard MySQL |

**💡 Note** : Ce service est interne au cluster. Ne le changez que si vous avez une raison spécifique.

---

### 🐳 Dockerfile

**Fichier** : `Dockerfile` (à la racine du projet)

Définit l'image Docker du backend.

#### Paramètres Configurables

| Paramètre | Description | Valeur par Défaut | Modification |
|-----------|-------------|-------------------|--------------|
| `FROM node:18` | Image de base Node.js | `node:18` | Peut être changé pour une autre version (ex: `node:20`) |
| `EXPOSE 3000` | Port exposé | `3000` | Modifiez si vous changez le port du backend |
| `WORKDIR /app` | Répertoire de travail | `/app` | Généralement pas besoin de changer |

#### Comment Modifier

1. Ouvrez le `Dockerfile`
2. Modifiez les valeurs souhaitées
3. Sauvegardez le fichier
4. Reconstruisez l'image : `docker build -t myasso-backend:latest .`
5. Redéployez : `kubectl rollout restart deployment/backend-deployment`

---

### 🔄 Adaptation à d'Autres Environnements

#### Environnement de Développement

**Modifications recommandées** :

1. **Réduire les répliques** :
   ```yaml
   # deployment-backend.yaml
   replicas: 1  # Au lieu de 2
   ```

2. **Réduire les ressources** :
   ```yaml
   # deployment-backend.yaml et deployment-mysql.yaml
   resources:
     requests:
       memory: "128Mi"  # Au lieu de 256Mi
       cpu: "50m"       # Au lieu de 100m
   ```

3. **Changer l'environnement Node.js** :
   ```yaml
   # configmap.yaml
   node-env: development
   ```

#### Environnement de Production

**Modifications recommandées** :

1. **Augmenter les répliques** :
   ```yaml
   # deployment-backend.yaml
   replicas: 3  # Au lieu de 2
   ```

2. **Augmenter les ressources** :
   ```yaml
   resources:
     requests:
       memory: "512Mi"
       cpu: "250m"
     limits:
       memory: "1Gi"
       cpu: "1000m"
   ```

3. **Utiliser un registry Docker** :
   - Construire et pousser l'image vers Docker Hub ou un registry privé
   - Modifier `deployment-backend.yaml` :
     ```yaml
     image: votre-registry/myasso-backend:latest
     imagePullPolicy: Always
     ```

4. **Sécuriser les secrets** :
   - Utiliser un gestionnaire de secrets (ex: HashiCorp Vault)
   - Ne jamais commiter les secrets dans Git

---

## 💾 Persistance des Données (Important !)

### ✅ Oui, vos données sont conservées grâce au PVC !

Le **PersistentVolumeClaim (PVC)** garantit que **toutes vos données sont sauvegardées**, même si vous :

- ✅ Redémarrez Minikube (`minikube stop` puis `minikube start`)
- ✅ Supprimez les Pods (`kubectl delete pods ...`)
- ✅ Redéployez l'application

### 🧪 Test de Persistance

**Scénario : Ajouter des utilisateurs puis relancer**

#### 1. Ajouter des Données

```powershell
# 1. Lancer l'application
minikube service backend-service

# 2. Dans l'application :
#    - Créez un compte association
#    - Créez un compte bénévole
#    - Créez des événements
#    - Ajoutez des données de test
```

#### 2. Arrêter et Relancer

```powershell
# Arrêter Minikube
minikube stop

# Redémarrer Minikube
minikube start
minikube docker-env | Invoke-Expression
Start-Sleep -Seconds 30
kubectl get pods
minikube service backend-service
```

#### 3. Vérifier que les Données Sont Toujours Là

**✅ Tous vos utilisateurs, événements et données doivent être présents !**

### 🔍 Vérifier la Persistance dans MySQL

```powershell
# Se connecter au Pod MySQL
kubectl exec -it deployment/mysql-deployment -- mysql -uroot -p

# Entrer le mot de passe root (depuis k8s/secret.yaml)
# Puis dans MySQL :
USE myasso;
SHOW TABLES;
SELECT COUNT(*) FROM associations;  -- Nombre d'associations
SELECT COUNT(*) FROM benevoles;      -- Nombre de bénévoles
SELECT * FROM associations;          -- Liste des associations
EXIT;
```

**✅ Si vous voyez vos données = Persistance fonctionne !**

### ⚠️ Important : Quand les Données Sont Perdues

**❌ Les données sont perdues uniquement si :**

- Vous supprimez le PVC : `kubectl delete pvc mysql-pvc`
- Vous supprimez Minikube : `minikube delete`
- Vous supprimez manuellement le volume Docker

**✅ Les données SONT conservées si :**

- Vous redémarrez Minikube
- Vous supprimez et recréez les Pods
- Vous redéployez l'application
- Vous modifiez les ConfigMaps/Secrets

---

## 🔍 Dépannage

### Vérifier les Logs

```powershell
# Logs MySQL
kubectl logs -f deployment/mysql-deployment

# Logs Backend
kubectl logs -f deployment/backend-deployment

# Logs d'un Pod spécifique
kubectl logs <nom-du-pod>
```

### Problème : Image Docker non trouvée

**Symptômes** : Pods en état "ImagePullBackOff"

**Solution** :
```powershell
# Réactiver l'environnement Docker de Minikube
minikube docker-env | Invoke-Expression

# Reconstruire l'image
docker build -t myasso-backend:latest .

# Vérifier que l'imagePullPolicy est "IfNotPresent" dans deployment-backend.yaml
```

### Problème : MySQL ne démarre pas

**Solution** :
```powershell
# Vérifier les logs
kubectl logs deployment/mysql-deployment

# Vérifier les événements
kubectl describe pod -l app=mysql

# Vérifier le PVC
kubectl get pvc
kubectl describe pvc mysql-pvc
```

### Problème : Backend ne peut pas se connecter à MySQL

**Solution** :
```powershell
# Vérifier que MySQL est Running
kubectl get pods -l app=mysql

# Vérifier que le service MySQL existe
kubectl get service mysql-service

# Tester depuis un Pod backend
kubectl exec -it deployment/backend-deployment -- sh
# Dans le shell : ping mysql-service
```

### Nettoyer et Redéployer

```powershell
# Supprimer tous les déploiements
cd k8s
kubectl delete -f .

# Attendre quelques secondes
Start-Sleep -Seconds 5

# Redéployer
kubectl apply -f .
```

### Reconstruire l'Image et Redéployer

```powershell
# 1. Activer l'environnement Docker de Minikube
minikube docker-env | Invoke-Expression

# 2. Reconstruire l'image
cd D:\MyAsso
docker build -t myasso-backend:latest .

# 3. Supprimer les Pods backend pour forcer le redémarrage
kubectl delete pods -l app=backend

# Les Pods seront recréés automatiquement avec la nouvelle image
```

### Arrêter/Démarrer Minikube

```powershell
# Arrêter Minikube
minikube stop

# Démarrer Minikube
minikube start

# Supprimer le cluster (⚠️ supprime toutes les données)
minikube delete
```

---

## 📊 Commandes Utiles

```powershell
# Voir tous les Pods
kubectl get pods

# Voir tous les Services
kubectl get services

# Voir les événements récents
kubectl get events --sort-by='.lastTimestamp'

# Détails d'un Pod
kubectl describe pod <nom-du-pod>

# Entrer dans un Pod
kubectl exec -it <nom-du-pod> -- sh

# Voir les logs en temps réel
kubectl logs -f deployment/backend-deployment

# Redémarrer un Deployment
kubectl rollout restart deployment/backend-deployment
```

---

## ✅ Démarrage Express - Checklist

**🎯 Suivez ces étapes dans l'ordre pour lancer le projet sur votre machine :**

- [ ] **1. Démarrer Minikube**
  ```powershell
  minikube start
  minikube docker-env | Invoke-Expression
  ```

- [ ] **2. Construire l'image Docker**
  ```powershell
  cd D:\MyAsso
  docker build -t myasso-backend:latest .
  ```

- [ ] **3. Modifier les secrets** (⚠️ OBLIGATOIRE)
  - Ouvrir `k8s/secret.yaml`
  - Changer `mysql-root-password`, `mysql-password`, et `jwt-secret`
  - Sauvegarder

- [ ] **4. Déployer sur Kubernetes**
  ```powershell
  cd k8s
  kubectl apply -f secret.yaml
  kubectl apply -f configmap.yaml
  kubectl apply -f configmap-init-db.yaml
  kubectl apply -f persistentvolumeclaim.yaml
  kubectl apply -f deployment-mysql.yaml
  kubectl apply -f service-db.yaml
  kubectl wait --for=condition=ready pod -l app=mysql --timeout=120s
  kubectl apply -f deployment-backend.yaml
  kubectl apply -f service-backend.yaml
  ```

- [ ] **5. Vérifier les Pods**
  ```powershell
  kubectl get pods
  ```
  (Tous doivent être en état "Running")

- [ ] **6. Accéder à l'application**
  ```powershell
  minikube service backend-service
  ```

**⏱️ Temps estimé** : 5-10 minutes (première fois)

---

## 📚 Ressources

- [Documentation Kubernetes](https://kubernetes.io/docs/)
- [Documentation Minikube](https://minikube.sigs.k8s.io/docs/)
- [Documentation Docker](https://docs.docker.com/)

---

**✅ Votre application MyAsso est maintenant déployée sur Kubernetes !**
