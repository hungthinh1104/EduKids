# Azure backend-only demo deploy

Rẻ nhất cho demo 1-2 ngày là chạy duy nhất backend container trên 1 Azure VM nhỏ và dùng PostgreSQL, Redis có sẵn bên ngoài.

## 1. Azure resources tối thiểu

- 1 Ubuntu VM nhỏ: `B1s` hoặc `B2s`
- 1 Azure Speech resource
- DB và Redis external đã có sẵn

## 2. Biến môi trường cần có

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<db>?sslmode=require
REDIS_URL=redis://:<password>@<host>:6379
REDIS_HOST=<host>
REDIS_PORT=6379
REDIS_PASSWORD=<password>
JWT_SECRET=<strong-secret>
JWT_EXPIRY=24h
CORS_ORIGIN=https://<frontend-domain>

PRONUNCIATION_PROVIDER=AZURE_SPEECH
AZURE_SPEECH_KEY=<azure-speech-key>
AZURE_SPEECH_REGION=<azure-region>
AZURE_SPEECH_LANGUAGE=en-US
```

## 3. Build image trên VM

```bash
git clone <repo>
cd EduKids
docker build -f docker/Dockerfile.backend -t edukids-backend ./apps/backend
```

## 4. Chạy backend container duy nhất

```bash
docker run -d \
  --name edukids-backend \
  --restart unless-stopped \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e PORT=3001 \
  -e DATABASE_URL="$DATABASE_URL" \
  -e REDIS_URL="$REDIS_URL" \
  -e REDIS_HOST="$REDIS_HOST" \
  -e REDIS_PORT="$REDIS_PORT" \
  -e REDIS_PASSWORD="$REDIS_PASSWORD" \
  -e JWT_SECRET="$JWT_SECRET" \
  -e JWT_EXPIRY=24h \
  -e CORS_ORIGIN="$CORS_ORIGIN" \
  -e PRONUNCIATION_PROVIDER=AZURE_SPEECH \
  -e AZURE_SPEECH_KEY="$AZURE_SPEECH_KEY" \
  -e AZURE_SPEECH_REGION="$AZURE_SPEECH_REGION" \
  -e AZURE_SPEECH_LANGUAGE=en-US \
  edukids-backend
```

## 5. Kiểm tra health

```bash
curl http://<vm-ip>:3001/api/system/health
```

## 6. Ghi chú pronunciation

- Backend hiện hỗ trợ Azure Speech khi request gửi lên có `audioBase64`
- Nếu không có `audioBase64` hoặc thiếu Azure env, backend tự fallback về cơ chế chấm `CUSTOM`
- Dữ liệu audio nên là WAV base64 hoặc data URL WAV để Azure Speech nhận ổn định
