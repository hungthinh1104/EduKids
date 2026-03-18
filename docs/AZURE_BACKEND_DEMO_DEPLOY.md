# Azure Backend Deploy

## Tùy chọn deploy

| Option | Chi phí demo | Độ phức tạp |
|---|---|---|
| **Azure VM** (B1s/B2s) + Docker | ~$8–16/tháng | Thấp — SSH + docker run |
| **Azure Container Apps** | ~$0–5/tháng (scale-to-zero) | Trung bình — ACA + ACR |

Cả 2 cách đều có GitHub Actions pipeline sẵn tại `.github/workflows/deploy-backend-azure.yml`.

---

## CI/CD tự động (khuyên dùng)

### Secrets cần set trong GitHub repo (`Settings → Secrets and variables`)

| Secret | Ý nghĩa |
|---|---|
| `ACR_LOGIN_SERVER` | `myregistry.azurecr.io` |
| `ACR_USERNAME` | ACR username (từ Azure portal) |
| `ACR_PASSWORD` | ACR password |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `REDIS_HOST` | Redis hostname |
| `REDIS_PASSWORD` | Redis password |
| `JWT_SECRET` | JWT signing key |
| `SMTP_USER` | Email account |
| `SMTP_PASSWORD` | Email app password |
| `AZURE_SPEECH_KEY` | Azure Speech service key |
| **[VM only]** `VM_HOST` | IP hoặc hostname VM |
| **[VM only]** `VM_USERNAME` | SSH username |
| **[VM only]** `VM_SSH_PRIVATE_KEY` | Private SSH key |
| **[Container Apps only]** `AZURE_CREDENTIALS` | Service principal JSON |

### Variables (không nhạy cảm) trong GitHub repo

| Variable | Ví dụ |
|---|---|
| `DEPLOY_TARGET` | `vm` hoặc `container-app` |
| `FRONTEND_URL` | `https://edukids.vercel.app` |
| `CORS_ORIGIN` | `https://edukids.vercel.app` |
| `PUBLIC_API_BASE_URL` | `https://api.yourdomain.com/api` |
| `AZURE_SPEECH_REGION` | `eastus` |
| **[Container Apps only]** `CONTAINER_APP_NAME` | `edukids-backend` |
| **[Container Apps only]** `AZURE_RESOURCE_GROUP` | `edukids-rg` |

Push lên `main` → workflow tự động chạy: build → push ACR → deploy.

---

## Deploy thủ công (Azure Container Apps) — đã test chạy ổn

### 1. Resources đang dùng (demo hiện tại)

- Container App: `edukids-backend`
- Container Apps Environment: `edukids-env`
- Resource Group: `edukids-rg`
- ACR: `edukidsacr03180908`
- Log Analytics: `workspace-edukidsrg0O17`
- Region: `southeastasia`

### 2. Build + push image lên ACR (cách ổn định)

> Dùng ACR remote build để tránh lỗi mạng khi push local.

```bash
cd /path/to/EduKids
cp docker/Dockerfile.backend apps/backend/Dockerfile.backend.acr

TAG="manual-$(date +%Y%m%d%H%M%S)"
az acr build \
  --registry edukidsacr03180908 \
  --image "edukids-backend:$TAG" \
  --image "edukids-backend:latest" \
  --file apps/backend/Dockerfile.backend.acr \
  ./apps/backend

rm -f apps/backend/Dockerfile.backend.acr
```

### 3. Tạo app (lần đầu) hoặc update image (các lần sau)

```bash
ACR_NAME="edukidsacr03180908"
RG="edukids-rg"
APP="edukids-backend"
ENV_NAME="edukids-env"

ACR_SERVER=$(az acr show -n "$ACR_NAME" --query loginServer -o tsv)
ACR_USER=$(az acr credential show -n "$ACR_NAME" --query username -o tsv)
ACR_PASS=$(az acr credential show -n "$ACR_NAME" --query passwords[0].value -o tsv)

az containerapp create \
  --name "$APP" \
  --resource-group "$RG" \
  --environment "$ENV_NAME" \
  --image "$ACR_SERVER/edukids-backend:$TAG" \
  --target-port 3001 \
  --ingress external \
  --registry-server "$ACR_SERVER" \
  --registry-username "$ACR_USER" \
  --registry-password "$ACR_PASS" \
  --cpu 0.5 \
  --memory 1.0Gi \
  --min-replicas 0 \
  --max-replicas 1
```

Nếu app đã tồn tại, chỉ cần update image:

```bash
az containerapp update \
  --name "$APP" \
  --resource-group "$RG" \
  --image "$ACR_SERVER/edukids-backend:$TAG"
```

### 4. Nạp env production thật vào Container App

```bash
mapfile -t ENV_ARGS < <(grep -Ev '^[[:space:]]*#|^[[:space:]]*$' apps/backend/.env.production)

az containerapp update \
  --name edukids-backend \
  --resource-group edukids-rg \
  --set-env-vars "${ENV_ARGS[@]}"
```

### 5. Kiểm tra trạng thái + health

```bash
az containerapp revision list -n edukids-backend -g edukids-rg -o table

FQDN=$(az containerapp show -n edukids-backend -g edukids-rg --query properties.configuration.ingress.fqdn -o tsv)
echo "https://$FQDN/api/system/health"
curl -i -H 'Origin: https://edu-kids-domain.vercel.app' "https://$FQDN/api/system/health"
```

> Lưu ý: backend production chặn request không có `Origin`, nên gọi health bằng `curl` cần thêm header `Origin` hợp lệ nếu muốn kết quả giống trình duyệt.

### 6. Backend URL hiện tại

- Base URL: `https://edukids-backend.purpleocean-cb1d49c8.southeastasia.azurecontainerapps.io`
- API URL: `https://edukids-backend.purpleocean-cb1d49c8.southeastasia.azurecontainerapps.io/api`

### 7. Lưu ý chi phí (gói student/free)

- Container Apps Consumption + `minReplicas=0` là lựa chọn tiết kiệm.
- ACR Basic **không free** (có phí riêng).

---

## Deploy thủ công (VM)

### 1. Azure resources tối thiểu

- 1 Ubuntu VM: `B1s` hoặc `B2s`
- 1 Azure Container Registry (Basic tier ~$5/tháng)
- 1 Azure Speech resource
- DB và Redis external đã có sẵn

### 2. Biến môi trường cần có

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
