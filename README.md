# 🚀 MyAsso - Application Web avec Base de Données sur Kubernetes

**Projet de Déploiement d'une Application Web Node.js avec Base de Données MySQL sur un Cluster Kubernetes**

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture du Système](#architecture-du-système)
3. [Composants Kubernetes](#composants-kubernetes)
4. [Prérequis](#prérequis)
5. [Installation et Déploiement](#installation-et-déploiement)
6. [Fonctionnement Détaillé](#fonctionnement-détaillé)
7. [Guide d'Utilisation](#guide-dutilisation)
8. [Dépannage](#dépannage)
9. [Tests et Validation](#tests-et-validation)

---

## 🎯 Vue d'ensemble

### Description du Projet

Ce projet déploie une application web **Node.js** (MyAsso - plateforme de gestion des associations et bénévoles) connectée à une base de données **MySQL** sur un cluster **Kubernetes**.

### Objectifs

- Déployer une base de données MySQL comme Pod Kubernetes
- Déployer une application web Node.js comme Pod Kubernetes
- Configurer la communication interne via un Service ClusterIP
- Exposer l'application web à l'extérieur via un Service NodePort
- Gérer la configuration via Secrets et ConfigMaps
- Garantir la persistance des données avec un PersistentVolumeClaim

### Technologies Utilisées

- **Backend** : Node.js avec Express.js
- **Base de données** : MySQL 8.0
- **Containerisation** : Docker
- **Orchestration** : Kubernetes
- **API** : REST API avec authentification JWT

---

## 🏗️ Architecture du Système

### Vue d'ensemble de l'Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cluster Kubernetes                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Namespace: default                      │  │
│  │                                                       │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │         MySQL Database Pod                   │   │  │
│  │  │  ┌────────────────────────────────────┐     │   │  │
│  │  │  │  Container: mysql                  │     │   │  │
│  │  │  │  Image: mysql:8.0                  │     │   │  │
│  │  │  │  Port: 3306                        │     │   │  │
│  │  │  └────────────────────────────────────┘     │   │  │
│  │  │  ┌────────────────────────────────────┐     │   │  │
│  │  │  │  Volume: mysql-pvc (Persistent)    │     │   │  │
│  │  │  │  Mount: /var/lib/mysql             │     │   │  │
│  │  │  └────────────────────────────────────┘     │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │           │                                          │  │
│  │           │ Service: mysql-service (ClusterIP)      │  │
│  │           │ Port: 3306                              │  │
│  │           │                                         │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │      Backend Application Pods (x2)           │   │  │
│  │  │  ┌────────────────────────────────────┐     │   │  │
│  │  │  │  Container: backend                │     │   │  │
│  │  │  │  Image: myasso-backend:latest      │     │   │  │
│  │  │  │  Port: 3000                        │     │   │  │
│  │  │  │                                    │     │   │  │
│  │  │  │  Env Vars:                         │     │   │  │
│  │  │  │  - DB_HOST=mysql-service           │     │   │  │
│  │  │  │  - DB_PORT=3306                    │     │   │  │
│  │  │  │  - DB_USER=myasso                  │     │   │  │
│  │  │  │  - DB_NAME=myasso                  │     │   │  │
│  │  │  │  - DB_PASSWORD (from Secret)       │     │   │  │
│  │  │  │  - JWT_SECRET (from Secret)        │     │   │  │
│  │  │  └────────────────────────────────────┘     │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │           │                                          │  │
│  │           │ Service: backend-service (NodePort)     │  │
│  │           │ Port: 3000 -> NodePort: 30080          │  │
│  │           │                                         │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │          ConfigMaps & Secrets               │   │  │
│  │  │  - myasso-config (ports, names)             │   │  │
│  │  │  - mysql-init-script (SQL schema)           │   │  │
│  │  │  - myasso-secrets (passwords, JWT)          │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────  │  │
└─────────────────────────────────────────────────────────────┘
           │
           │ NodePort: 30080
           ▼
┌──────────────────────────────────────┐
│        Utilisateurs Externes         │
│    http://<NODE_IP>:30080            │
└──────────────────────────────────────┘
```

### Flux de Données

1. **Utilisateur externe** → Accède via NodePort (30080)
2. **NodePort Service** → Route vers un Pod backend disponible
3. **Backend Pod** → Se connecte à MySQL via le Service ClusterIP `mysql-service`
4. **MySQL Service** → Route vers le Pod MySQL
5. **MySQL Pod** → Lit/écrit dans le volume persistant `mysql-pvc`

### Communication Interne

- **Backend ↔ MySQL** : Communication via DNS Kubernetes
  - Le backend utilise `mysql-service` comme hostname
  - Kubernetes résout automatiquement vers l'IP du service
  - Le service route vers le Pod MySQL

---

## 🔧 Composants Kubernetes

### 1. Secrets (`k8s/secret.yaml`)

**Rôle** : Stocker les informations sensibles de manière sécurisée.

**Contenu** :
- `mysql-root-password` : Mot de passe root MySQL
- `mysql-password` : Mot de passe utilisateur MySQL
- `jwt-secret` : Clé secrète pour l'authentification JWT

**Utilisation** : Les Pods référencent ces secrets via `secretKeyRef` dans leurs variables d'environnement.

```yaml
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: myasso-secrets
        key: mysql-password
```

### 2. ConfigMaps

#### a) `k8s/configmap.yaml`
**Rôle** : Stocker la configuration non sensible.

**Contenu** :
- Noms de base de données
- Ports
- Variables d'environnement (NODE_ENV, PORT, etc.)

#### b) `k8s/configmap-init-db.yaml`
**Rôle** : Contient le script SQL d'initialisation de la base de données.

**Utilisation** : Monté dans MySQL comme volume à `/docker-entrypoint-initdb.d/`, MySQL exécute automatiquement ces scripts au premier démarrage.

### 3. PersistentVolumeClaim (`k8s/persistentvolumeclaim.yaml`)

**Rôle** : Demander un volume de stockage persistant pour MySQL.

**Caractéristiques** :
- **Taille** : 10Gi
- **Mode d'accès** : ReadWriteOnce (un seul Pod peut écrire)
- **Stockage** : Garantit que les données MySQL persistent même si le Pod est recréé

**Montage** : Le volume est monté dans MySQL à `/var/lib/mysql` (dossier par défaut de MySQL pour les données).

### 4. Deployment MySQL (`k8s/deployment-mysql.yaml`)

**Rôle** : Gérer le Pod MySQL avec ses répliques.

**Caractéristiques** :
- **Réplicas** : 1 (une seule instance MySQL pour éviter les conflits de données)
- **Image** : `mysql:8.0`
- **Port** : 3306
- **Variables d'environnement** :
  - `MYSQL_ROOT_PASSWORD` : Depuis Secret
  - `MYSQL_DATABASE` : Depuis ConfigMap
  - `MYSQL_USER` : Depuis ConfigMap
  - `MYSQL_PASSWORD` : Depuis Secret
- **Volumes** :
  - `mysql-data` : PersistentVolumeClaim pour la persistance
  - `mysql-init` : ConfigMap contenant le script SQL
- **Health Checks** :
  - **Liveness Probe** : Vérifie que MySQL répond (`mysqladmin ping`)
  - **Readiness Probe** : Vérifie que MySQL est prêt à accepter des connexions

**Cycle de vie** :
1. Le Pod démarre
2. MySQL s'initialise avec les variables d'environnement
3. Le script SQL dans le ConfigMap s'exécute automatiquement
4. Les health checks vérifient que MySQL est opérationnel
5. Le Pod devient "Ready"

### 5. Service MySQL (`k8s/service-db.yaml`)

**Rôle** : Exposer MySQL aux autres Pods dans le cluster.

**Type** : **ClusterIP** (service interne uniquement, non accessible de l'extérieur)

**Caractéristiques** :
- **Nom DNS** : `mysql-service` (résolu automatiquement par Kubernetes)
- **Port** : 3306
- **Sélecteur** : `app: mysql` (route vers les Pods avec ce label)

**Avantage** : 
- Le backend se connecte à `mysql-service:3306` sans connaître l'IP réelle du Pod
- Si le Pod MySQL est recréé avec une nouvelle IP, le Service continue de fonctionner

### 6. Deployment Backend (`k8s/deployment-backend.yaml`)

**Rôle** : Gérer les Pods de l'application Node.js.

**Caractéristiques** :
- **Réplicas** : 2 (haute disponibilité, load balancing automatique)
- **Image** : `myasso-backend:latest`
- **Port** : 3000
- **Variables d'environnement** :
  - `DB_HOST=mysql-service` (nom du service MySQL)
  - `DB_PORT=3306`
  - `DB_USER`, `DB_NAME` : Depuis ConfigMap
  - `DB_PASSWORD`, `JWT_SECRET` : Depuis Secrets
- **Init Container** : Attend que MySQL soit prêt avant de démarrer le backend
  ```yaml
  initContainers:
    - name: wait-for-mysql
      image: busybox
      command: ['sh', '-c', 'until nc -z mysql-service 3306; do sleep 2; done']
  ```
- **Health Checks** :
  - **Liveness Probe** : Vérifie `/api/health` toutes les 10 secondes
  - **Readiness Probe** : Vérifie `/api/health` toutes les 5 secondes

**Cycle de vie** :
1. L'init container attend que MySQL soit disponible
2. Le container backend démarre
3. Le backend lit les variables d'environnement
4. Le backend se connecte à MySQL via `mysql-service:3306`
5. Les health checks vérifient que l'API répond
6. Le Pod devient "Ready"

### 7. Service Backend (`k8s/service-backend.yaml`)

**Rôle** : Exposer l'application web à l'extérieur du cluster.

**Type** : **NodePort** (accessible depuis l'extérieur via l'IP d'un nœud)

**Caractéristiques** :
- **Port interne** : 3000
- **NodePort** : 30080 (port externe accessible sur tous les nœuds)
- **Sélecteur** : `app: backend` (route vers les Pods backend)
- **Load Balancing** : Distribue automatiquement les requêtes entre les 2 répliques

**Accès** :
- Depuis l'extérieur : `http://<NODE_IP>:30080`
- Avec Minikube : `minikube service backend-service` (ouvre automatiquement le navigateur)

---

## 📦 Prérequis

### Logiciels Requis

1. **Docker**
   - Installation : [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)
   - Vérification : `docker --version`

2. **Kubernetes (un des suivants)** :
   
   **Option A : Minikube (Recommandé pour développement local)**
   ```bash
   # Windows (avec Chocolatey)
   choco install minikube
   
   # Démarrer Minikube
   minikube start
   ```
   
   **Option B : Kind (Kubernetes in Docker)**
   ```bash
   # Windows (avec Chocolatey)
   choco install kind
   
   # Créer un cluster
   kind create cluster
   ```
   
   **Option C : Cluster Cloud (GKE, EKS, AKS)**
   - Configurer `kubectl` pour se connecter à votre cluster

3. **kubectl**
   - Installation : [https://kubernetes.io/docs/tasks/tools/](https://kubernetes.io/docs/tasks/tools/)
   - Vérification : `kubectl version --client`

4. **Node.js** (pour développement local, optionnel)
   - Installation : [https://nodejs.org/](https://nodejs.org/)
   - Vérification : `node --version`

### Vérification de l'Environnement

```bash
# Vérifier Docker
docker --version

# Vérifier Kubernetes
kubectl version --client

# Vérifier la connexion au cluster
kubectl cluster-info

# Lister les nœuds
kubectl get nodes
```

---

## 🚀 Installation et Déploiement

### Étape 1 : Construire l'Image Docker du Backend

```bash
# Aller dans le dossier backend
cd backend

# Construire l'image Docker
docker build -t myasso-backend:latest .
```

**Résultat attendu** : Image Docker `myasso-backend:latest` créée localement.

### Étape 2 : Charger l'Image dans le Cluster

#### Pour Minikube :
```bash
# Charger l'image dans Minikube
minikube image load myasso-backend:latest

# Vérifier que l'image est chargée
minikube image ls | grep myasso-backend
```

#### Pour Kind :
```bash
# Charger l'image dans Kind
kind load docker-image myasso-backend:latest
```

#### Pour un Registry Docker (Production) :
```bash
# Tagger l'image avec votre registry
docker tag myasso-backend:latest <registry>/myasso-backend:latest

# Pousser l'image
docker push <registry>/myasso-backend:latest

# Modifier k8s/deployment-backend.yaml :
# image: <registry>/myasso-backend:latest
# imagePullPolicy: Always
```

### Étape 3 : Personnaliser la Configuration

**⚠️ IMPORTANT** : Modifiez les secrets avant le déploiement en production !

Éditez `k8s/secret.yaml` :

```yaml
stringData:
  mysql-root-password: VOTRE_MOT_DE_PASSE_ROOT_SECURISE
  mysql-password: VOTRE_MOT_DE_PASSE_USER_SECURISE
  jwt-secret: VOTRE_CLE_JWT_LONGUE_ET_ALEATOIRE
```

Pour générer une clé JWT sécurisée :
```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### Étape 4 : Déployer sur Kubernetes

#### Option A : Script Automatique (Recommandé)

**Linux/Mac :**
```bash
cd k8s
chmod +x deploy.sh
./deploy.sh
```

**Windows :**
```bash
cd k8s
deploy.bat
```

#### Option B : Déploiement Manuel

```bash
cd k8s

# 1. Créer les Secrets
kubectl apply -f secret.yaml

# 2. Créer les ConfigMaps
kubectl apply -f configmap.yaml
kubectl apply -f configmap-init-db.yaml

# 3. Créer le PersistentVolumeClaim
kubectl apply -f persistentvolumeclaim.yaml

# 4. Déployer MySQL
kubectl apply -f deployment-mysql.yaml
kubectl apply -f service-db.yaml

# 5. Attendre que MySQL soit prêt (30 secondes recommandées)
sleep 30  # ou sur Windows: timeout /t 30

# 6. Déployer le Backend
kubectl apply -f deployment-backend.yaml
kubectl apply -f service-backend.yaml
```

#### Option C : Déploiement en Une Commande

```bash
cd k8s
kubectl apply -f .
```

### Étape 5 : Vérifier le Déploiement

```bash
# Vérifier les Pods
kubectl get pods

# Résultat attendu :
# NAME                                  READY   STATUS    RESTARTS   AGE
# backend-deployment-xxxxx-xxxxx       1/1     Running   0          30s
# backend-deployment-xxxxx-xxxxx       1/1     Running   0          30s
# mysql-deployment-xxxxx-xxxxx         1/1     Running   0          2m

# Vérifier les Services
kubectl get services

# Résultat attendu :
# NAME              TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
# backend-service   NodePort    10.96.xxx.xxx   <none>        3000:30080/TCP   30s
# mysql-service     ClusterIP   10.96.xxx.xxx   <none>        3306/TCP         2m

# Vérifier les PVC
kubectl get pvc

# Résultat attendu :
# NAME        STATUS   VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE
# mysql-pvc   Bound    pvc-xxx  10Gi       RWO            standard       2m
```

---

## ⚙️ Fonctionnement Détaillé

### 1. Démarrage de MySQL

1. **Kubernetes crée le Pod MySQL** depuis le Deployment
2. **Le PersistentVolumeClaim est lié** à un volume physique
3. **MySQL démarre** avec les variables d'environnement (root password, database, user)
4. **Le script SQL d'initialisation** (`configmap-init-db.yaml`) est exécuté automatiquement :
   - Crée la base de données `myasso`
   - Crée toutes les tables (associations, benevoles, evenements, etc.)
5. **Les health checks** vérifient que MySQL est prêt
6. **Le Pod passe à "Ready"** et peut accepter des connexions

**Temps estimé** : 30-60 secondes

### 2. Démarrage du Backend

1. **L'init container démarre en premier** :
   - Utilise `busybox` (image légère)
   - Teste la connexion TCP à `mysql-service:3306` toutes les 2 secondes
   - Attend que MySQL soit disponible
2. **Une fois MySQL prêt**, l'init container se termine
3. **Le container backend démarre** :
   - Lit les variables d'environnement (DB_HOST, DB_PASSWORD, etc.)
   - Se connecte à MySQL via `mysql-service:3306`
   - Démarre le serveur Express sur le port 3000
4. **Les health checks** vérifient que `/api/health` répond
5. **Le Pod passe à "Ready"**

**Temps estimé** : 10-20 secondes (après que MySQL soit prêt)

### 3. Communication Backend ↔ MySQL

1. **Le backend utilise `mysql-service` comme hostname** dans la variable `DB_HOST`
2. **Kubernetes DNS** résout `mysql-service` en l'IP du Service ClusterIP
3. **Le Service** route la connexion vers le Pod MySQL
4. **MySQL** répond avec les données demandées

**Avantages** :
- Pas besoin de connaître l'IP du Pod MySQL
- Si le Pod MySQL est recréé, le Service continue de fonctionner
- Load balancing automatique si plusieurs répliques MySQL (non configuré ici)

### 4. Exposition Externe via NodePort

1. **L'utilisateur** accède à `http://<NODE_IP>:30080`
2. **Le NodePort Service** écoute sur le port 30080 de tous les nœuds
3. **Le Service** route la requête vers un Pod backend disponible (load balancing)
4. **Le Pod backend** traite la requête et répond
5. **La réponse** est renvoyée à l'utilisateur

**Exemple avec Minikube** :
```bash
# Obtenir l'URL d'accès
minikube service backend-service --url
# Résultat : http://192.168.49.2:30080

# Ou ouvrir directement dans le navigateur
minikube service backend-service
```

### 5. Persistance des Données

1. **Le PersistentVolumeClaim** demande 10Gi de stockage
2. **Kubernetes** alloue un volume physique (sur le nœud ou via un provisioner)
3. **Le volume est monté** dans le Pod MySQL à `/var/lib/mysql`
4. **MySQL stocke toutes les données** dans ce volume
5. **Si le Pod MySQL est supprimé** :
   - Les données restent dans le volume
   - Un nouveau Pod peut être créé avec les mêmes données

**Test de persistance** :
```bash
# Supprimer le Pod MySQL (Kubernetes le recréera automatiquement)
kubectl delete pod -l app=mysql

# Attendre que le nouveau Pod démarre
kubectl get pods -l app=mysql

# Vérifier que les données sont toujours là
kubectl exec -it deployment/mysql-deployment -- mysql -u myasso -p -e "USE myasso; SHOW TABLES;"
```

---

## 📖 Guide d'Utilisation

### Accéder à l'Application

#### Méthode 1 : Via Port-Forward (Recommandé pour tests locaux)

```bash
# Créer un tunnel local
kubectl port-forward service/backend-service 3000:3000

# Accéder à l'application
# http://localhost:3000
```

#### Méthode 2 : Via NodePort (Accès externe)

**Avec Minikube :**
```bash
# Obtenir l'URL
minikube service backend-service --url

# Ou ouvrir directement
minikube service backend-service
```

**Avec un cluster cloud :**
```bash
# Obtenir l'IP d'un nœud
kubectl get nodes -o wide

# Accéder via
# http://<NODE_IP>:30080
```

### Tester l'API

```bash
# Test de santé (via port-forward)
curl http://localhost:3000/api/health

# Résultat attendu :
# {"status":"OK","message":"API is running"}

# Test d'inscription association
curl -X POST http://localhost:3000/api/auth/register/association \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test Association",
    "email": "test@example.com",
    "password": "password123",
    "description": "Description de test"
  }'
```

### Voir les Logs

```bash
# Logs du backend
kubectl logs -f deployment/backend-deployment

# Logs d'un Pod spécifique
kubectl logs -f <pod-name>

# Logs de MySQL
kubectl logs -f deployment/mysql-deployment
```

### Accéder à la Base de Données

```bash
# Se connecter à MySQL
kubectl exec -it deployment/mysql-deployment -- mysql -u myasso -p

# Entrer le mot de passe (depuis le secret)
# Une fois connecté :
USE myasso;
SHOW TABLES;
SELECT * FROM associations;
```

### Redimensionner les Déploiements

```bash
# Augmenter le nombre de répliques du backend
kubectl scale deployment backend-deployment --replicas=3

# Vérifier
kubectl get pods -l app=backend
```

### Mettre à Jour l'Image Docker

```bash
# 1. Reconstruire l'image
cd backend
docker build -t myasso-backend:latest .

# 2. Recharger dans le cluster (Minikube)
minikube image load myasso-backend:latest

# 3. Redémarrer les Pods pour utiliser la nouvelle image
kubectl rollout restart deployment/backend-deployment

# Vérifier le statut
kubectl rollout status deployment/backend-deployment
```

---

## 🔍 Dépannage

### Problème : Les Pods ne démarrent pas

**Symptômes** :
```bash
kubectl get pods
# STATUS: Pending ou CrashLoopBackOff
```

**Solutions** :

1. **Vérifier les événements** :
```bash
kubectl get events --sort-by='.lastTimestamp'
kubectl describe pod <pod-name>
```

2. **Vérifier les logs** :
```bash
kubectl logs <pod-name>
kubectl logs <pod-name> --previous  # Si le Pod a redémarré
```

3. **Problèmes courants** :
   - **Image non trouvée** : Vérifier que l'image est chargée dans le cluster
   - **PVC non lié** : Vérifier `kubectl get pvc`
   - **Secrets manquants** : Vérifier `kubectl get secrets`

### Problème : Le backend ne peut pas se connecter à MySQL

**Symptômes** :
```bash
kubectl logs deployment/backend-deployment
# Erreur: ECONNREFUSED ou Timeout
```

**Solutions** :

1. **Vérifier que MySQL est prêt** :
```bash
kubectl get pods -l app=mysql
kubectl logs deployment/mysql-deployment
```

2. **Tester la connexion depuis le backend** :
```bash
kubectl exec -it deployment/backend-deployment -- sh
# Dans le shell :
nc -zv mysql-service 3306
```

3. **Vérifier les variables d'environnement** :
```bash
kubectl describe pod -l app=backend | grep -A 20 "Environment"
```

4. **Vérifier les secrets** :
```bash
kubectl get secret myasso-secrets -o yaml
```

### Problème : Le NodePort n'est pas accessible

**Symptômes** : Impossible d'accéder à `http://<NODE_IP>:30080`

**Solutions** :

1. **Vérifier que le Service existe** :
```bash
kubectl get service backend-service
```

2. **Vérifier que les Pods backend sont Ready** :
```bash
kubectl get pods -l app=backend
```

3. **Tester avec port-forward d'abord** :
```bash
kubectl port-forward service/backend-service 3000:3000
# Puis tester http://localhost:3000
```

4. **Avec Minikube** : Utiliser `minikube service backend-service` au lieu de l'IP directement

### Problème : Les données sont perdues après redémarrage

**Cause** : Le PVC n'est pas correctement configuré ou lié.

**Solutions** :

1. **Vérifier le PVC** :
```bash
kubectl get pvc mysql-pvc
kubectl describe pvc mysql-pvc
```

2. **Vérifier que le volume est monté** :
```bash
kubectl describe pod -l app=mysql | grep -A 10 "Volumes"
```

3. **Vérifier les StorageClasses disponibles** :
```bash
kubectl get storageclass
```

### Problème : L'image Docker n'est pas trouvée

**Symptômes** :
```bash
kubectl get pods
# STATUS: ImagePullBackOff ou ErrImagePull
```

**Solutions** :

1. **Avec Minikube** : Charger l'image
```bash
minikube image load myasso-backend:latest
```

2. **Vérifier l'imagePullPolicy** dans `deployment-backend.yaml` :
```yaml
imagePullPolicy: IfNotPresent  # Pour images locales
# ou
imagePullPolicy: Always        # Pour registry Docker
```

3. **Avec un registry** : Vérifier les credentials et l'URL

---

## ✅ Tests et Validation

### Test 1 : Vérification des Pods

```bash
kubectl get pods
# Vérifier que tous les Pods sont "Running" et "Ready"
```

### Test 2 : Vérification des Services

```bash
kubectl get services
# Vérifier que les services existent et ont des CLUSTER-IP
```

### Test 3 : Test de Santé de l'API

```bash
# Via port-forward
kubectl port-forward service/backend-service 3000:3000
curl http://localhost:3000/api/health

# Réponse attendue :
# {"status":"OK","message":"API is running"}
```

### Test 4 : Test de Connexion à MySQL

```bash
# Se connecter à MySQL
kubectl exec -it deployment/mysql-deployment -- mysql -u myasso -p

# Entrer le mot de passe, puis :
USE myasso;
SHOW TABLES;
# Doit afficher toutes les tables créées
```

### Test 5 : Test de Persistance

```bash
# 1. Créer des données de test
kubectl exec -it deployment/mysql-deployment -- mysql -u myasso -p -e "USE myasso; INSERT INTO associations (nom, email, password) VALUES ('Test', 'test@test.com', 'hash');"

# 2. Supprimer le Pod MySQL
kubectl delete pod -l app=mysql

# 3. Attendre que le nouveau Pod démarre (30 secondes)
kubectl get pods -l app=mysql

# 4. Vérifier que les données sont toujours là
kubectl exec -it deployment/mysql-deployment -- mysql -u myasso -p -e "USE myasso; SELECT * FROM associations;"
# Doit afficher les données créées
```

### Test 6 : Test de Résilience

```bash
# Supprimer un Pod backend (Kubernetes le recréera automatiquement)
kubectl delete pod -l app=backend

# Vérifier qu'un nouveau Pod démarre
kubectl get pods -l app=backend

# Vérifier que l'application fonctionne toujours
curl http://localhost:3000/api/health
```

### Test 7 : Test de Load Balancing

```bash
# Faire plusieurs requêtes (les Pods backend tournent)
for i in {1..10}; do
  curl http://localhost:3000/api/health
  echo ""
done

# Vérifier les logs de chaque Pod pour voir la distribution
kubectl logs deployment/backend-deployment --all-containers=true
```

---

## 📚 Ressources Supplémentaires

- **Documentation Kubernetes** : [https://kubernetes.io/docs/](https://kubernetes.io/docs/)
- **Documentation Docker** : [https://docs.docker.com/](https://docs.docker.com/)
- **Documentation MySQL** : [https://dev.mysql.com/doc/](https://dev.mysql.com/doc/)
- **Documentation Node.js** : [https://nodejs.org/docs/](https://nodejs.org/docs/)

---

## 🎯 Conclusion

Ce projet démontre comment déployer une application web complète sur Kubernetes avec :
- ✅ Déploiement de base de données avec persistance
- ✅ Déploiement d'application web avec haute disponibilité
- ✅ Communication interne sécurisée via Services
- ✅ Exposition externe via NodePort
- ✅ Gestion de configuration via Secrets et ConfigMaps
- ✅ Health checks et redémarrage automatique
- ✅ Persistance des données

Le système est **production-ready** avec quelques ajustements de sécurité (secrets réels, ingress controller, etc.).

---

**Projet réalisé pour le TP Kubernetes - Déploiement d'Application Web avec Base de Données**
