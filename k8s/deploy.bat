@echo off
REM Script de déploiement Kubernetes pour MyAsso (Windows)
REM Ce script déploie toutes les ressources nécessaires dans le bon ordre

echo 🚀 Déploiement de MyAsso sur Kubernetes...
echo.

REM Vérifier que kubectl est disponible
kubectl version --client >nul 2>&1
if errorlevel 1 (
    echo ❌ kubectl n'est pas installé ou n'est pas dans le PATH
    exit /b 1
)

REM Vérifier la connexion au cluster
kubectl cluster-info >nul 2>&1
if errorlevel 1 (
    echo ❌ Impossible de se connecter au cluster Kubernetes
    echo    Vérifiez que kubectl est configuré correctement
    exit /b 1
)

echo ✅ Connexion au cluster Kubernetes réussie
echo.

REM Déployer dans l'ordre
echo 1️⃣  Création des Secrets...
kubectl apply -f secret.yaml
if errorlevel 1 (
    echo ❌ Erreur lors du déploiement des Secrets
    exit /b 1
)
echo ✅ Secrets déployés avec succès
echo.

echo 2️⃣  Création des ConfigMaps...
kubectl apply -f configmap.yaml
kubectl apply -f configmap-init-db.yaml
if errorlevel 1 (
    echo ❌ Erreur lors du déploiement des ConfigMaps
    exit /b 1
)
echo ✅ ConfigMaps déployés avec succès
echo.

echo 3️⃣  Création du PersistentVolumeClaim...
kubectl apply -f persistentvolumeclaim.yaml
if errorlevel 1 (
    echo ❌ Erreur lors du déploiement du PersistentVolumeClaim
    exit /b 1
)
echo ✅ PersistentVolumeClaim déployé avec succès
echo.

echo 4️⃣  Déploiement de MySQL...
kubectl apply -f deployment-mysql.yaml
kubectl apply -f service-db.yaml
if errorlevel 1 (
    echo ❌ Erreur lors du déploiement de MySQL
    exit /b 1
)
echo ✅ MySQL déployé avec succès
echo.

echo 5️⃣  Attente que MySQL soit prêt...
echo    Attente de 30 secondes...
timeout /t 30 /nobreak >nul
echo ✅ Attente terminée
echo.

echo 6️⃣  Déploiement du Backend...
kubectl apply -f deployment-backend.yaml
kubectl apply -f service-backend.yaml
if errorlevel 1 (
    echo ❌ Erreur lors du déploiement du Backend
    exit /b 1
)
echo ✅ Backend déployé avec succès
echo.

echo 🎉 Déploiement terminé !
echo.
echo 📊 Statut des Pods :
kubectl get pods
echo.
echo 📊 Statut des Services :
kubectl get services
echo.
echo 🔍 Pour voir les logs du backend :
echo    kubectl logs -f deployment/backend-deployment
echo.
echo 🔍 Pour voir les logs de MySQL :
echo    kubectl logs -f deployment/mysql-deployment
echo.
echo 🌐 Pour accéder à l'application :
echo    - Avec Minikube : minikube service backend-service
echo    - Avec port-forward : kubectl port-forward service/backend-service 3000:3000
echo    - Via NodePort : http://^<NODE_IP^>:30080

