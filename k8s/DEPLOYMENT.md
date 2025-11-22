# 📋 Récapitulatif des Fichiers Kubernetes

## 📁 Structure des Fichiers

Tous les fichiers suivants se trouvent dans le dossier `k8s/` :

### 🔐 Secrets et Configuration

| Fichier | Description | Usage |
|---------|-------------|-------|
| `secret.yaml` | Mots de passe MySQL et clé JWT | **⚠️ À modifier en production !** |
| `configmap.yaml` | Configuration non sensible (ports, noms) | Peut être ajusté selon vos besoins |
| `configmap-init-db.yaml` | Script SQL d'initialisation | Contient le schéma de la base de données |

### 💾 Stockage

| Fichier | Description | Usage |
|---------|-------------|-------|
| `persistentvolumeclaim.yaml` | Volume persistant pour MySQL (10Gi) | Garantit la persistance des données |

### 🗄️ Base de Données MySQL

| Fichier | Description | Composants |
|---------|-------------|------------|
| `deployment-mysql.yaml` | Pod MySQL avec health checks | Container MySQL 8.0, PVC, ConfigMap init |
| `service-db.yaml` | Service ClusterIP pour MySQL | Communication interne uniquement |

### 🌐 Application Web

| Fichier | Description | Composants |
|---------|-------------|------------|
| `deployment-backend.yaml` | Pods Node.js backend (2 répliques) | Health checks, init container pour attendre MySQL |
| `service-backend.yaml` | Service NodePort pour exposer l'app | Port externe : 30080 |

### 📜 Scripts et Documentation

| Fichier | Description |
|---------|-------------|
| `deploy.sh` | Script de déploiement automatique (Linux/Mac) |
| `deploy.bat` | Script de déploiement automatique (Windows) |
| `README.md` | Documentation complète de déploiement |
| `DEPLOYMENT.md` | Ce fichier (récapitulatif) |

## 🚀 Déploiement Rapide

### Option 1 : Script Automatique

**Linux/Mac :**
```bash
cd k8s
chmod +x deploy.sh
./deploy.sh
```

**Windows :**
```cmd
cd k8s
deploy.bat
```

### Option 2 : Déploiement Manuel

```bash
cd k8s
kubectl apply -f secret.yaml
kubectl apply -f configmap.yaml
kubectl apply -f configmap-init-db.yaml
kubectl apply -f persistentvolumeclaim.yaml
kubectl apply -f deployment-mysql.yaml
kubectl apply -f service-db.yaml
kubectl apply -f deployment-backend.yaml
kubectl apply -f service-backend.yaml
```

### Option 3 : Déploiement en Une Commande

```bash
cd k8s
kubectl apply -f .
```

## 📊 Ordre de Déploiement Recommandé

1. **Secrets** → `secret.yaml`
2. **ConfigMaps** → `configmap.yaml`, `configmap-init-db.yaml`
3. **PersistentVolumeClaim** → `persistentvolumeclaim.yaml`
4. **MySQL Deployment** → `deployment-mysql.yaml`
5. **MySQL Service** → `service-db.yaml`
6. **Attendre que MySQL soit prêt** (30 secondes recommandées)
7. **Backend Deployment** → `deployment-backend.yaml`
8. **Backend Service** → `service-backend.yaml`

## 🔍 Vérification Post-Déploiement

```bash
# Vérifier les Pods
kubectl get pods

# Vérifier les Services
kubectl get services

# Vérifier les PVC
kubectl get pvc

# Vérifier les ConfigMaps
kubectl get configmaps

# Vérifier les Secrets
kubectl get secrets

# Voir les logs du backend
kubectl logs -f deployment/backend-deployment

# Voir les logs de MySQL
kubectl logs -f deployment/mysql-deployment

# Tester la santé de l'API
kubectl port-forward service/backend-service 3000:3000
curl http://localhost:3000/api/health
```

## ⚙️ Configuration Importante

### 🔐 Modifier les Secrets (OBLIGATOIRE en production)

Éditez `secret.yaml` et changez :
- `mysql-root-password` : Mot de passe root MySQL
- `mysql-password` : Mot de passe utilisateur MySQL  
- `jwt-secret` : Clé secrète JWT (utilisez une clé longue et aléatoire)

### 🖼️ Image Docker du Backend

**Option A : Image locale (Minikube/Kind)**

1. Construire l'image :
```bash
cd ../myasso/backend
docker build -t myasso-backend:latest .
```

2. Charger dans Minikube :
```bash
minikube image load myasso-backend:latest
```

3. Dans `deployment-backend.yaml`, garder :
```yaml
imagePullPolicy: IfNotPresent
```

**Option B : Registry Docker**

1. Tagger et pousser l'image :
```bash
docker tag myasso-backend:latest <registry>/myasso-backend:latest
docker push <registry>/myasso-backend:latest
```

2. Modifier `deployment-backend.yaml` :
```yaml
image: <registry>/myasso-backend:latest
imagePullPolicy: Always
```

## 🗑️ Nettoyage

Pour supprimer tous les déploiements :

```bash
kubectl delete -f .
```

**⚠️ Attention :** Cela supprimera également le PVC et toutes les données de la base de données !

Pour ne supprimer que les déploiements (garder les données) :

```bash
kubectl delete deployment backend-deployment mysql-deployment
kubectl delete service backend-service mysql-service
```

## 📝 Notes Importantes

1. **Persistance des données** : Les données MySQL sont stockées dans le PVC `mysql-pvc`. Si vous supprimez le PVC, toutes les données seront perdues.

2. **Health Checks** : 
   - MySQL : Utilise `mysqladmin ping` avec les credentials root
   - Backend : Utilise `/api/health` endpoint

3. **Init Container** : Le backend attend que MySQL soit disponible via un init container qui teste la connexion TCP.

4. **NodePort** : Le service backend expose l'application sur le port `30080` par défaut. Vous pouvez le modifier dans `service-backend.yaml`.

5. **Réplicas** : Le backend est configuré avec 2 répliques pour la haute disponibilité. MySQL utilise 1 réplica (recommandé pour une base de données).

## 🔗 Liens Utiles

- [README.md](./README.md) - Documentation complète de déploiement
- [Documentation Kubernetes](https://kubernetes.io/docs/)
- [Documentation MySQL](https://dev.mysql.com/doc/)

