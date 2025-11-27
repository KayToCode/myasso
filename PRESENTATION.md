# 🎤 Présentation MyAsso - TP Kubernetes

**Durée : 10 minutes** | **Trinôme Cyber 3**

---

## 📋 SLIDE 1 : Introduction (30 secondes)

### 🖥️ À AFFICHER À L'ÉCRAN :
```
┌─────────────────────────────────────────┐
│         MyAsso                          │
│  Plateforme de gestion des              │
│  associations et bénévoles              │
│                                         │
│  Déployée sur Kubernetes                │
│                                         │
│  Trinôme Cyber 3                         │
└─────────────────────────────────────────┘
```

### 🗣️ À DIRE :
> "Bonjour, nous allons vous présenter **MyAsso**, une plateforme web de gestion des associations et bénévoles que nous avons développée et déployée sur Kubernetes. Dans cette présentation de 10 minutes, nous allons vous montrer l'application, son architecture, et le processus de déploiement sur Kubernetes."

---

## 📋 SLIDE 2 : Vue d'ensemble de l'Application (1 minute 30)

### 🖥️ À AFFICHER À L'ÉCRAN :
```
┌─────────────────────────────────────────┐
│      Vue d'ensemble de MyAsso           │
│                                         │
│  🏢 POUR LES ASSOCIATIONS :             │
│  • Gérer leur profil                    │
│  • Créer des événements                 │
│  • Gérer les bénévoles                  │
│  • Publier des annonces                 │
│                                         │
│  👥 POUR LES BÉNÉVOLES :                │
│  • Découvrir les associations           │
│  • Indiquer ses disponibilités          │
│  • Recevoir des assignations            │
│                                         │
│  ✨ FONCTIONNALITÉS :                   │
│  • Authentification JWT                 │
│  • Assignation automatique              │
│  • Interface moderne                    │
└─────────────────────────────────────────┘
```

### 🗣️ À DIRE :
> "MyAsso est une application web qui répond à un besoin réel : faciliter la gestion des associations et de leurs bénévoles. Elle propose deux types d'utilisateurs : les associations et les bénévoles. Les associations peuvent créer des événements, gérer leurs bénévoles et publier des annonces. Les bénévoles peuvent découvrir les associations, indiquer leurs disponibilités et recevoir des assignations automatiques. L'application utilise une authentification sécurisée avec JWT et propose une interface moderne et responsive."

---

## 📋 SLIDE 3 : Technologies Utilisées (1 minute)

### 🖥️ À AFFICHER À L'ÉCRAN :
```
┌─────────────────────────────────────────┐
│        Stack Technique                  │
│                                         │
│  FRONTEND :                             │
│  • HTML5 / CSS3                         │
│  • JavaScript (Vanilla)                 │
│                                         │
│  BACKEND :                              │
│  • Node.js + Express.js                 │
│  • JWT (Authentification)               │
│  • bcrypt (Hashage)                     │
│                                         │
│  BASE DE DONNÉES :                      │
│  • MySQL 8.0                            │
│                                         │
│  INFRASTRUCTURE :                       │
│  • Docker (Conteneurisation)            │
│  • Kubernetes (Orchestration)           │
│  • Minikube (Cluster local)             │
└─────────────────────────────────────────┘
```

### 🗣️ À DIRE :
> "Pour développer cette application, nous avons utilisé une stack moderne. Côté frontend, du HTML5, CSS3 et JavaScript vanilla pour une application légère. Côté backend, Node.js avec Express.js pour l'API REST, avec une authentification sécurisée via JWT et le hashage des mots de passe avec bcrypt. Pour la base de données, MySQL 8.0. Et pour l'infrastructure, Docker pour la conteneurisation, Kubernetes pour l'orchestration, et Minikube pour créer un cluster local."

---

## 📋 SLIDE 4 : Architecture Complète du Projet (2 minutes 30 secondes)

### 🖥️ À AFFICHER À L'ÉCRAN :

**Partie 1 - Architecture du Code Source :**
```
┌─────────────────────────────────────────┐
│   ARCHITECTURE DU CODE SOURCE           │
│                                         │
│  MyAsso/                                │
│  ├── frontend/          → Interface UI  │
│  │   ├── *.html (pages)                │
│  │   ├── css/style.css                 │
│  │   └── js/*.js (logique)             │
│  ├── backend/           → API REST      │
│  │   ├── server.js                     │
│  │   ├── routes/ (endpoints API)       │
│  │   ├── middleware/ (auth JWT)        │
│  │   └── services/ (logique métier)    │
│  ├── k8s/              → Config K8s     │
│  │   ├── deployment-*.yaml             │
│  │   ├── service-*.yaml                │
│  │   ├── secret.yaml                   │
│  │   └── configmap.yaml                │
│  └── Dockerfile        → Image Docker   │
└─────────────────────────────────────────┘
```

**Partie 2 - Architecture Kubernetes (Déploiement) :**
```
┌─────────────────────────────────────────┐
│   ARCHITECTURE KUBERNETES               │
│                                         │
│   ┌──────────────┐  ┌──────────────┐   │
│   │ Backend Pod 1│  │ Backend Pod 2│   │
│   │  (Node.js)   │  │  (Node.js)   │   │
│   └──────┬───────┘  └──────┬───────┘   │
│          │                 │            │
│          └────────┬────────┘            │
│                   │                     │
│          ┌────────▼────────┐           │
│          │  MySQL Pod      │           │
│          │  (PVC 10Gi)     │           │
│          └─────────────────┘           │
│                                         │
│  Ressources Kubernetes :                │
│  • Secrets (mots de passe)             │
│  • ConfigMaps (configuration)          │
│  • Services (ClusterIP + NodePort)     │
└─────────────────────────────────────────┘
```

### 🗣️ À DIRE :

> "Pour bien comprendre notre projet, je vais vous expliquer deux aspects complémentaires : l'organisation du code source et l'architecture de déploiement sur Kubernetes.
>
> **Premièrement, l'architecture du code source.** Notre projet est structuré de manière claire et modulaire. Le dossier frontend contient toute l'interface utilisateur : les pages HTML, le CSS pour le style, et le JavaScript pour la logique côté client. Le dossier backend contient l'API REST avec Node.js et Express : les routes qui gèrent les endpoints comme l'authentification, la gestion des associations, des bénévoles et des événements. Il y a aussi des middlewares pour l'authentification JWT et des services pour la logique métier comme l'algorithme d'assignation automatique. Le dossier k8s contient tous les fichiers YAML de configuration Kubernetes : les deployments qui définissent comment déployer MySQL et le backend, les services pour la communication, les secrets pour les mots de passe sécurisés, et les configmaps pour la configuration. Enfin, le Dockerfile transforme tout ce code source en une image Docker prête à être déployée.
>
> **Deuxièmement, l'architecture Kubernetes une fois déployée.** Quand l'application tourne, nous avons trois composants principaux. Un Pod MySQL qui stocke toutes les données de l'application dans un volume persistant de 10 gigaoctets. Ce volume garantit que les données persistent même après redémarrage. Ensuite, nous avons deux Pods backend en réplique, chacun exécutant une instance de notre application Node.js. Cette configuration assure la haute disponibilité : si un Pod plante, l'autre continue de fonctionner et les utilisateurs ne voient aucune interruption. Tous ces composants communiquent via des Services Kubernetes : le service MySQL est en ClusterIP, donc accessible uniquement à l'intérieur du cluster pour la sécurité, et le service backend est en NodePort, accessible de l'extérieur sur le port 30080. Les Secrets stockent les mots de passe et la clé JWT, tandis que les ConfigMaps contiennent la configuration comme les ports et les noms de base de données.
>
> Le lien entre ces deux architectures ? Le Dockerfile transforme notre code source en image Docker, et les fichiers YAML Kubernetes déploient cette image dans des Pods qui communiquent via des Services."

---

## 📋 SLIDE 5 : Processus de Déploiement (1 minute)

### 🖥️ À AFFICHER À L'ÉCRAN :
```
┌─────────────────────────────────────────┐
│   Processus de Déploiement              │
│                                         │
│   1. Préparation                        │
│      minikube start                     │
│      minikube docker-env                │
│                                         │
│   2. Conteneurisation                   │
│      docker build -t myasso-backend     │
│                                         │
│   3. Configuration                      │
│      Éditer secret.yaml                 │
│                                         │
│   4. Déploiement Kubernetes             │
│      kubectl apply -f secret.yaml       │
│      kubectl apply -f configmap.yaml    │
│      kubectl apply -f pvc.yaml          │
│      kubectl apply -f mysql.yaml        │
│      kubectl apply -f backend.yaml      │
│                                         │
│   5. Accès                              │
│      minikube service backend-service   │
└─────────────────────────────────────────┘
```

### 🗣️ À DIRE :
> "Le processus de déploiement se fait en plusieurs étapes. D'abord, on démarre Minikube et on configure Docker pour utiliser l'environnement Minikube. Ensuite, on construit l'image Docker du backend à partir du Dockerfile. On configure les secrets, notamment les mots de passe MySQL. Puis on déploie les ressources Kubernetes dans l'ordre : les secrets et configmaps d'abord, puis le volume persistant, ensuite MySQL qu'on attend qu'il soit prêt, et enfin le backend. Une fois tout déployé, on accède à l'application avec la commande minikube service."

---

## 📋 SLIDE 6 : Points Techniques Importants (1 minute)

### 🖥️ À AFFICHER À L'ÉCRAN :
```
┌─────────────────────────────────────────┐
│   Points Techniques Clés                │
│                                         │
│  🔄 Init Containers                     │
│  • MySQL : Crée les tables au démarrage │
│  • Backend : Attend que MySQL soit prêt │
│                                         │
│  ❤️ Health Checks                       │
│  • Liveness Probe : Conteneur vivant ?  │
│  • Readiness Probe : Prêt à recevoir ?  │
│  • Redémarrage automatique si erreur    │
│                                         │
│  💾 Persistance (PVC)                   │
│  • 10Gi de stockage                     │
│  • Données conservées après redémarrage │
│                                         │
│  🔒 Sécurité                            │
│  • Secrets (mots de passe encodés)      │
│  • JWT (authentification)               │
│  • bcrypt (hashage)                     │
└─────────────────────────────────────────┘
```

### 🗣️ À DIRE :
> "Plusieurs points techniques sont importants dans notre déploiement. D'abord, les init containers : MySQL exécute automatiquement un script SQL au premier démarrage pour créer toutes les tables, et le backend attend que MySQL soit prêt avant de démarrer. Ensuite, les health checks : Kubernetes vérifie régulièrement que les conteneurs sont vivants et prêts, et redémarre automatiquement ceux qui tombent en panne. La persistance des données est garantie par un PersistentVolumeClaim de 10 gigaoctets, ce qui signifie que même si on redémarre Minikube, les données sont conservées. Enfin, la sécurité : les mots de passe sont dans des Secrets Kubernetes, l'authentification utilise JWT, et les mots de passe sont hashés avec bcrypt dans la base."

---

## 📋 SLIDE 7 : Démonstration + Vérification Kubernetes (1 minute 30)

### 🖥️ À AFFICHER À L'ÉCRAN :
**SOIT** : Capture d'écran de l'application **SOIT** : Terminal avec commandes

**Option 1 - Si démo live :**
```
Commande 1 : minikube start
Commande 2 : kubectl get pods
Commande 3 : minikube service backend-service
```

**Option 2 - Si capture d'écran :**
```
Montrer :
• Page d'accueil moderne
• Inscription (Association/Bénévole)
• Tableau de bord avec statistiques
• Interface responsive
```

### 🗣️ À DIRE :
> "Maintenant, passons à la démonstration. Je vais démarrer Minikube, vérifier que tous les pods sont en cours d'exécution, puis accéder à l'application. [Exécuter les commandes si démo live, sinon montrer les captures d'écran] L'application propose une interface moderne et responsive. On peut s'inscrire comme association ou bénévole, se connecter de manière sécurisée, et accéder aux tableaux de bord adaptés. Vérifions maintenant l'état de notre déploiement Kubernetes : nous avons 1 Pod MySQL et 2 Pods Backend tous en état Running, les services sont correctement configurés, et le PVC est lié avec 10 gigaoctets de stockage. Cela confirme que notre architecture fonctionne correctement avec la haute disponibilité."

---

## 📋 SLIDE 8 : Conclusion (1 minute)

### 🖥️ À AFFICHER À L'ÉCRAN :
```
┌─────────────────────────────────────────┐
│         Conclusion                      │
│                                         │
│  ✅ RÉALISATIONS :                      │
│  • Application web complète             │
│  • Conteneurisation Docker              │
│  • Déploiement Kubernetes               │
│  • Persistance des données              │
│  • Sécurité (Secrets, JWT)              │
│  • Haute disponibilité (2 répliques)    │
│                                         │
│  📚 COMPÉTENCES DÉVELOPPÉES :           │
│  • Full-Stack Development               │
│  • Docker & Conteneurisation            │
│  • Kubernetes & Orchestration           │
│  • Architecture microservices           │
│                                         │
│  🎯 PERSPECTIVES :                      │
│  • Monitoring (Prometheus/Grafana)      │
│  • CI/CD (GitHub Actions)               │
│  • Déploiement cloud (AWS/GCP/Azure)    │
│  • Scaling automatique                  │
└─────────────────────────────────────────┘
```

### 🗣️ À DIRE :
> "Pour conclure, nous avons développé une application web complète qui répond à un vrai besoin : faciliter la gestion des associations et de leurs bénévoles. Nous l'avons conteneurisée avec Docker et déployée sur Kubernetes avec tous les composants nécessaires : persistance des données, health checks pour la résilience, et sécurité avec les Secrets. L'architecture en 2 répliques garantit la haute disponibilité. Ce projet nous a permis de maîtriser le développement full-stack, Docker et Kubernetes. Pour la suite, nous pourrions ajouter du monitoring avec Prometheus, mettre en place un pipeline CI/CD avec GitHub Actions, ou déployer sur un cluster cloud de production avec scaling automatique. Merci de votre attention, avez-vous des questions ?"

---

---

## 📝 RÉSUMÉ DU TIMING (10 minutes)

| Slide | Sujet | Durée | Temps cumulé |
|-------|-------|-------|--------------|
| 1 | Introduction | 30s | 0:30 |
| 2 | Vue d'ensemble | 1:30 | 2:00 |
| 3 | Technologies | 1:00 | 3:00 |
| 4 | Architecture complète | 2:30 | 5:30 |
| 5 | Processus de déploiement | 1:00 | 6:30 |
| 6 | Points techniques | 1:00 | 7:30 |
| 7 | Démonstration + Vérification | 1:30 | 9:00 |
| 8 | Conclusion | 1:00 | **10:00** |

**✅ Timing total : 10 minutes exactement**

---

## 🎯 POINTS CLÉS À MÉMORISER

### Pour chaque slide, retenir :
1. **Le titre** : Dire clairement le sujet de la slide
2. **2-3 points principaux** : Ne pas tout lire, seulement les éléments importants
3. **Une phrase de transition** : Relier avec la slide suivante

### Exemples de transitions :
- "Maintenant que vous comprenez l'application, voyons les technologies utilisées..."
- "Passons à l'architecture Kubernetes qui est le cœur de notre déploiement..."
- "Avant de démontrer, expliquons les points techniques importants..."

---

## 💡 QUESTIONS POSSIBLES & RÉPONSES

### ❓ "Pourquoi 2 répliques du backend ?"
> "Pour la haute disponibilité. Si un Pod tombe en panne, l'autre continue de fonctionner sans interruption de service."

### ❓ "Comment fonctionne la persistance ?"
> "Le PersistentVolumeClaim monte un volume de 10Gi dans le Pod MySQL. Même si le Pod est supprimé ou redémarré, le volume reste et toutes les données sont conservées."

### ❓ "Comment le backend se connecte à MySQL ?"
> "Via le service Kubernetes nommé `mysql-service` sur le port 3306. Kubernetes résout automatiquement le nom DNS en interne, c'est la magie des Services Kubernetes."

### ❓ "Que se passe-t-il si MySQL plante ?"
> "Kubernetes détecte via les health checks que MySQL ne répond plus, redémarre automatiquement le Pod, et les données sont toujours là grâce au PVC."

---

## ✅ CHECKLIST AVANT LA PRÉSENTATION

- [ ] Tester que Minikube démarre correctement
- [ ] Vérifier que tous les pods sont en état Running
- [ ] Tester l'accès à l'application avec `minikube service backend-service`
- [ ] Préparer des captures d'écran de l'application (plan B si démo ne fonctionne pas)
- [ ] Préparer les captures des commandes Kubernetes
- [ ] Répéter le timing (surtout les premières slides pour ne pas aller trop vite)
- [ ] Préparer les réponses aux questions fréquentes

---

## 🎬 CONSEILS POUR LA PRÉSENTATION

### ⚠️ Si la démonstration ne fonctionne pas :
1. **Ne pas paniquer** : Montrer les captures d'écran préparées
2. **Expliquer quand même** : "Normalement on verrait ici... mais voici ce que ça donne"
3. **Continuer** : Ne pas s'attarder, passer à la suite

### 💬 Langage corporel :
- **Regard** : Regarder le public, pas seulement l'écran
- **Gestes** : Pointer les éléments importants sur les slides
- **Voix** : Parler clairement, faire des pauses entre les slides

### 📊 Gestes recommandés :
- Slide 5 (Architecture) : Dessiner dans l'air le flux entre les composants
- Slide 7 (Points techniques) : Compter sur les doigts les 4 points clés
- Slide 8 (Démo) : Montrer l'écran et pointer les éléments importants

---

**🎉 Bonne présentation ! Vous êtes prêts ! 🚀**

