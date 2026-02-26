# OCR worker — Node service for receipt OCR (Tesseract)
FROM node:20-alpine
WORKDIR /app
# Install Tesseract when TESSERACT_AVAILABLE=true; otherwise stub only
RUN apk add --no-cache tesseract-ocr tesseract-ocr-data-eng || true
COPY package*.json ./
RUN npm install --production
COPY index.js .
EXPOSE 3001
# SECURITY: Protect with OCR_API_KEY in production; server sends key in header
CMD ["node", "index.js"]
