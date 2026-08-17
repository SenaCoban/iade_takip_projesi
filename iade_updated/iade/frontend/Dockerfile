FROM node:18-alpine

WORKDIR /app

# SSL sertifika kontrolünü Docker build süreci için geçici olarak devre dışı bırak
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

COPY package*.json ./

# npm'i daha az katı ayarlarla çalıştır
RUN npm config set strict-ssl false && npm install

COPY . .

# Global kurulum yerine yerel kurulumu tercih edelim
RUN npm install react-scripts

CMD ["npm", "start"]
