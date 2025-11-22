# Guide de Déploiement Kubernetes - MyAsso

Ce guide explique comment déployer l'application MyAsso sur un cluster Kubernetes.

## 📋 Architecture

L'application est composée de :
- **Base de données MySQL** : Déployée dans un Pod avec un PersistentVolumeClaim pour la persistance
- **Backend Node.js** : Application web déployée dans un Pod
- **Services** : 
  - Service ClusterIP pour MySQL (communication interne)
  - Service NodePort pour le backend (accès externe)

## 🔧 Prérequis

- Un cluster Kubernetes fonctionnel (local avec Minikube/Kind, ou cloud)
- `kubectl` configuré et connecté au cluster
- Docker pour construire l'image du backend
- Accès à un registry Docker (optionnel, ou utilisation d'images locales)

## 📦 Structure des Fichiers

```
k8s/
├── secret.yaml                  # Secrets (mots de passe, JWT)
├── configmap.yaml               # Configuration non sensible
├── configmap-init-db.yaml      # Script SQL d'initialisation
├── persistentvolumeclaim.yaml   # Volume persistant pour MySQL
├── deployment-mysql.yaml        # Deployment MySQL
├── service-db.yaml              # Service ClusterIP MySQL
├── deployment-backend.yaml      # Deployment Node.js backend
├── service-backend.yaml         # Service NodePort backend
└── README.md                    # Cette documentation
```

## 🚀 Étapes de Déploiement

### 1. Préparer l'Image Docker du Backend

Avant de déployer, vous devez construire l'image Docker du backend :

```bash
cd ../myasso/backend
docker build -t myasso-backend:latest .
```

#### Option A : Utiliser une Image Locale (Minikube/Kind)

Si vous utilisez Minikube ou Kind, chargez l'image dans le cluster :

**Avec Minikube :**
```bash
minikube image load myasso-backend:latest
```

**Avec Kind :**
```bash
kind load docker-image myasso-backend:latest
```

Puis, dans `deployment-backend.yaml`, gardez :
```yaml
imagePullPolicy: IfNotPresent
```

#### Option B : Pousser vers un Registry Docker

Si vous utilisez un registry (Docker Hub, GCR, ECR, etc.) :

```bash
# Tag l'image avec votre registry
docker tag myasso-backend:latest <registry>/myasso-backend:latest

# Pousser l'image
docker push <registry>/myasso-backend:latest
```

Puis modifiez `deployment-backend.yaml` pour utiliser votre registry :
```yaml
image: <registry>/myasso-backend:latest
imagePullPolicy: Always
```

### 2. Personnaliser les Secrets

**⚠️ IMPORTANT :** Modifiez les secrets dans `secret.yaml` avant le déploiement en production !

Éditez `k8s/secret.yaml` et changez :
- `mysql-root-password` : Mot de passe root MySQL
- `mysql-password` : Mot de passe utilisateur MySQL
- `jwt-secret` : Clé secrète pour JWT (utilisez une clé longue et aléatoire)

### 3. Personnaliser la Configuration

Si nécessaire, ajustez les valeurs dans `configmap.yaml` :
- Noms de base de données
- Ports
- Variables d'environnement

### 4. Déployer les Ressources

Déployez les ressources dans l'ordre suivant :

```bash
# Aller dans le dossier k8s
cd k8s

# 1. Créer les Secrets
kubectl apply -f secret.yaml

# 2. Créer les ConfigMaps
kubectl apply -f configmap.yaml
kubectl apply -f configmap-init-db.yaml

# 3. Créer le PersistentVolumeClaim pour MySQL
kubectl apply -f persistentvolumeclaim.yaml

# 4. Déployer MySQL
kubectl apply -f deployment-mysql.yaml

# 5. Créer le Service MySQL (ClusterIP)
kubectl apply -f service-db.yaml

# 6. Déployer le Backend
kubectl apply -f deployment-backend.yaml

# 7. Créer le Service Backend (NodePort)
kubectl apply -f service-backend.yaml
```

**Ou déployez tout en une seule commande :**
```bash
kubectl apply -f .
```

### 5. Vérifier le Déploiement

Vérifiez que tous les Pods sont en cours d'exécution :

```bash
kubectl get pods
```

Vous devriez voir :
- `mysql-deployment-xxxxx` avec le statut `Running`
- `backend-deployment-xxxxx` avec le statut `Running` (2 répliques)

Vérifiez les services :

```bash
kubectl get services
```

Vous devriez voir :
- `mysql-service` de type `ClusterIP`
- `backend-service` de type `NodePort` sur le port `30080`

### 6. Vérifier les Logs

Pour voir les logs du backend :
```bash
kubectl logs -f deployment/backend-deployment
```

Pour voir les logs de MySQL :
```bash
kubectl logs -f deployment/mysql-deployment
```

### 7. Accéder à l'Application

#### Avec NodePort (Service de type NodePort)

**Avec Minikube :**
```bash
minikube service backend-service
```

**Avec un cluster cloud :**
Accédez à l'application via : `<NODE_IP>:30080`

Pour obtenir l'adresse IP d'un nœud :
```bash
kubectl get nodes -o wide
```

#### Avec Port-Forward (pour test local)

```bash
kubectl port-forward service/backend-service 3000:3000
```

Puis accédez à `http://localhost:3000`

## 🔍 Tests et Validation

### Test de Santé de l'API

```bash
# Via port-forward
curl http://localhost:3000/api/health

# Via NodePort (remplacez <NODE_IP> par l'IP de votre nœud)
curl http://<NODE_IP>:30080/api/health
```

### Test de Connexion à la Base de Données

Connectez-vous au Pod MySQL pour vérifier la base de données :

```bash
kubectl exec -it deployment/mysql-deployment -- mysql -u myasso -p
# Entrez le mot de passe depuis le secret

# Dans MySQL
USE myasso;
SHOW TABLES;
```

### Test de Résilience

Testez la persistance des données en redémarrant le Pod MySQL :

```bash
# Supprimer le Pod (Kubernetes le recréera automatiquement)
kubectl delete pod -l app=mysql

# Vérifier que les données sont toujours présentes
kubectl exec -it deployment/mysql-deployment -- mysql -u myasso -p -e "USE myasso; SHOW TABLES;"
```

## 📝 Paramètres de Configuration

### Secrets (`secret.yaml`)

| Clé | Description | Valeur par défaut |
|-----|-------------|-------------------|
| `mysql-root-password` | Mot de passe root MySQL | `rootpassword123` |
| `mysql-password` | Mot de passe utilisateur MySQL | `myassopassword123` |
| `jwt-secret` | Clé secrète JWT | `changez_cette_cle_secrete_en_production_k8s` |

### ConfigMap (`configmap.yaml`)

| Clé | Description | Valeur par défaut |
|-----|-------------|-------------------|
| `mysql-database` | Nom de la base de données | `myasso` |
| `mysql-user` | Utilisateur MySQL | `myasso` |
| `mysql-port` | Port MySQL | `3306` |
| `node-env` | Environnement Node.js | `production` |
| `port` | Port du backend | `3000` |
| `db-host` | Nom du service MySQL | `mysql-service` |
| `db-port` | Port de connexion à MySQL | `3306` |
| `db-name` | Nom de la base de données | `myasso` |
| `db-user` | Utilisateur pour la connexion | `myasso` |

### Service Backend (NodePort)

Le service backend expose l'application sur le port `30080` par défaut.

Pour changer le port NodePort, modifiez `service-backend.yaml` :
```yaml
nodePort: 30080  # Changez cette valeur (doit être entre 30000-32767)
```

### Ressources

Les ressources CPU et mémoire sont configurées dans les deployments :

- **MySQL** : 512Mi-1Gi RAM, 250m-500m CPU
- **Backend** : 256Mi-512Mi RAM, 100m-500m CPU

## 🔧 Dépannage

### Les Pods ne démarrent pas

```bash
# Vérifier les événements
kubectl get events --sort-by='.lastTimestamp'

# Vérifier les détails d'un Pod
kubectl describe pod <pod-name>

# Vérifier les logs
kubectl logs <pod-name>
```

### Problème de connexion à la base de données

1. Vérifiez que MySQL est prêt :
```bash
kubectl get pods -l app=mysql
kubectl logs deployment/mysql-deployment
```

2. Vérifiez les secrets :
```bash
kubectl get secret myasso-secrets -o yaml
```

3. Testez la connexion depuis le backend :
```bash
kubectl exec -it deployment/backend-deployment -- sh
# Dans le shell, testez la connexion
```

### Le PersistentVolumeClaim ne se lie pas

Vérifiez le stockage disponible :
```bash
kubectl get pv
kubectl get pvc
kubectl describe pvc mysql-pvc
```

Si vous utilisez Minikube, assurez-vous qu'un StorageClass est disponible :
```bash
kubectl get storageclass
```

## 🗑️ Nettoyage

Pour supprimer tous les déploiements :

```bash
kubectl delete -f .
```

Ou supprimez les ressources individuellement :

```bash
kubectl delete deployment backend-deployment mysql-deployment
kubectl delete service backend-service mysql-service
kubectl delete pvc mysql-pvc
kubectl delete configmap myasso-config mysql-init-script
kubectl delete secret myasso-secrets
```

**⚠️ Attention :** Supprimer le PVC supprimera également toutes les données de la base de données !

## 📚 Ressources Supplémentaires

- [Documentation Kubernetes](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [MySQL Kubernetes Guide](https://kubernetes.io/docs/tasks/run-application/run-replicated-stateful-application/)

## 🎯 Prochaines Étapes

Pour aller plus loin, vous pourriez :
- Utiliser un Ingress Controller pour un routage plus avancé
- Mettre en place des Horizontal Pod Autoscalers (HPA)
- Configurer des secrets managés avec un gestionnaire de secrets externe
- Ajouter un système de monitoring (Prometheus/Grafana)
- Implémenter des stratégies de backup pour la base de données

