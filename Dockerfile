FROM node:18

# Installer le backend dans /app
WORKDIR /app

# Copier et installer les dépendances du backend
COPY backend/package*.json ./
RUN npm install

# Copier le code du backend
COPY backend/ ./

# Copier le frontend dans /frontend (accessible depuis /app via ../frontend)
# On le fait après pour éviter de re-télécharger les dépendances si seul le frontend change
COPY frontend/ /frontend/

EXPOSE 3000

CMD ["npm", "start"]

