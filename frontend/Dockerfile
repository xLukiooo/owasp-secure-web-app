# frontend/Dockerfile

FROM node:20

# Katalog roboczy
WORKDIR /app

# Skopiuj plik zależności
COPY package.json yarn.lock* package-lock.json* ./
RUN npm install

# Skopiuj resztę kodu aplikacji
COPY . .

# Otwórz port 3000 (dev server React)
EXPOSE 3000

# Domyślne uruchomienie aplikacji w trybie deweloperskim
CMD ["npm", "start"]
