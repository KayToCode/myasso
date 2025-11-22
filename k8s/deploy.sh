#!/bin/bash

# Script de déploiement Kubernetes pour MyAsso
# Ce script déploie toutes les ressources nécessaires dans le bon ordre

echo "🚀 Déploiement de MyAsso sur Kubernetes..."
echo ""

# Vérifier que kubectl est disponible
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl n'est pas installé ou n'est pas dans le PATH"
    exit 1
fi

# Vérifier la connexion au cluster
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Impossible de se connecter au cluster Kubernetes"
    echo "   Vérifiez que kubectl est configuré correctement"
    exit 1
fi

echo "✅ Connexion au cluster Kubernetes réussie"
echo ""

# Fonction pour appliquer un fichier avec vérification
apply_file() {
    local file=$1
    local description=$2
    echo "📦 $description..."
    if kubectl apply -f "$file"; then
        echo "✅ $description déployé avec succès"
    else
        echo "❌ Erreur lors du déploiement de $description"
        return 1
    fi
    echo ""
}

# Déployer dans l'ordre
echo "1️⃣  Création des Secrets..."
apply_file "secret.yaml" "Secrets (mots de passe)"

echo "2️⃣  Création des ConfigMaps..."
apply_file "configmap.yaml" "ConfigMap de configuration"
apply_file "configmap-init-db.yaml" "ConfigMap d'initialisation MySQL"

echo "3️⃣  Création du PersistentVolumeClaim..."
apply_file "persistentvolumeclaim.yaml" "PersistentVolumeClaim MySQL"

echo "4️⃣  Déploiement de MySQL..."
apply_file "deployment-mysql.yaml" "Deployment MySQL"
apply_file "service-db.yaml" "Service MySQL (ClusterIP)"

echo "5️⃣  Attente que MySQL soit prêt..."
echo "   Attente de 30 secondes..."
sleep 30

# Vérifier que MySQL est prêt
echo "   Vérification du statut MySQL..."
for i in {1..30}; do
    if kubectl get pods -l app=mysql -o jsonpath='{.items[0].status.phase}' 2>/dev/null | grep -q Running; then
        if kubectl get pods -l app=mysql -o jsonpath='{.items[0].status.containerStatuses[0].ready}' 2>/dev/null | grep -q true; then
            echo "✅ MySQL est prêt !"
            break
        fi
    fi
    if [ $i -eq 30 ]; then
        echo "⚠️  MySQL n'est pas encore prêt, mais on continue..."
    else
        sleep 2
    fi
done
echo ""

echo "6️⃣  Déploiement du Backend..."
apply_file "deployment-backend.yaml" "Deployment Backend Node.js"
apply_file "service-backend.yaml" "Service Backend (NodePort)"

echo "🎉 Déploiement terminé !"
echo ""
echo "📊 Statut des Pods :"
kubectl get pods
echo ""
echo "📊 Statut des Services :"
kubectl get services
echo ""
echo "🔍 Pour voir les logs du backend :"
echo "   kubectl logs -f deployment/backend-deployment"
echo ""
echo "🔍 Pour voir les logs de MySQL :"
echo "   kubectl logs -f deployment/mysql-deployment"
echo ""
echo "🌐 Pour accéder à l'application :"
echo "   - Avec Minikube : minikube service backend-service"
echo "   - Avec port-forward : kubectl port-forward service/backend-service 3000:3000"
echo "   - Via NodePort : http://<NODE_IP>:30080"

