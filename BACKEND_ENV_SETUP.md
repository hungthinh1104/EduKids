# Backend Environment Variables Required

## Essential Variables (Must Configure)

### Database
- **DATABASE_URL** - PostgreSQL connection string
  - Example: `postgresql://user:password@localhost:5432/edukids`
  - Used for: Prisma ORM database connection

### Authentication
- **JWT_SECRET** - Secret key for JWT token signing
  - Default fallback: `edukids-secret-key-change-in-production`
  - ⚠️ **MUST change in production!**
  - Used for: Auth token generation and validation

### Redis Configuration
- **REDIS_HOST** - Redis server hostname
  - Default: `localhost`
  
- **REDIS_PORT** - Redis server port
  - Default: `6379`
  
- **REDIS_PASSWORD** - Redis authentication password (optional)
  - Default: none
  
- **REDIS_PROGRESS_DB** - Redis database number for progress sync
  - Default: `2`
  - Used for: Learning progress synchronization cache

## Optional Variables (Have Defaults)

### Pronunciation / Azure Speech
- **PRONUNCIATION_PROVIDER** - Provider dùng để chấm pronunciation
  - Values: `CUSTOM`, `AZURE_SPEECH`, `GOOGLE_SPEECH`
  - Demo recommendation: `AZURE_SPEECH`

- **AZURE_SPEECH_KEY** - Azure Speech subscription key
  - Required when `PRONUNCIATION_PROVIDER=AZURE_SPEECH`

- **AZURE_SPEECH_REGION** - Azure Speech region, ví dụ `southeastasia`
  - Required when `PRONUNCIATION_PROVIDER=AZURE_SPEECH`

- **AZURE_SPEECH_LANGUAGE** - Speech recognition language
  - Default: `en-US`

### CORS Configuration
- **CORS_ORIGIN** - Allowed frontend origin
  - Default: `http://localhost:3000`
  - Used for: Cross-Origin Resource Sharing

### Content Delivery
- **CLOUDINARY_BASE_URL** - Cloudinary CDN base URL for media
  - Default: `https://res.cloudinary.com/edukids`
  - Used for: Flashcard and content images

### Frontend URL (for gateways, not currently enabled)
- **FRONTEND_URL** - Frontend application URL
  - Default: `http://localhost:3000`
  - Used for: WebSocket gateway CORS (when enabled)

## Example .env File

```bash
# Database
DATABASE_URL="postgresql://<db_user>:<db_password>@localhost:5432/edukids"

# Authentication  
JWT_SECRET="<set-strong-jwt-secret-min-32-chars>"

# Redis Configuration
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""
REDIS_PROGRESS_DB=2

# CORS
CORS_ORIGIN="http://localhost:3000"

# Content Delivery
CLOUDINARY_BASE_URL="https://res.cloudinary.com/edukids"

# Pronunciation / Azure Speech
PRONUNCIATION_PROVIDER="CUSTOM"
AZURE_SPEECH_KEY=""
AZURE_SPEECH_REGION=""
AZURE_SPEECH_LANGUAGE="en-US"
```

## Setup Steps for Local Development

1. **PostgreSQL Database**
   ```bash
   # Create database
   createdb edukids
   
   # Set DATABASE_URL
  export DATABASE_URL="postgresql://<db_user>:<db_password>@localhost:5432/edukids"
   ```

2. **Redis Server**
   ```bash
   # Start Redis (macOS with brew)
   brew services start redis
   
   # Or using Docker
   docker run -d -p 6379:6379 redis:latest
   ```

3. **Run Prisma Migrations**
   ```bash
   npx prisma migrate deploy
   npx prisma seed  # Optional: seed sample data
   ```

4. **Start Backend**
   ```bash
   npm run start:dev
   ```

## Optional: Disabled Modules (Don't Need Variables)

These modules are disabled and don't require environment setup:
- Analytics Module (commented out in app.module.ts)
- Pronunciation Module  
- Report Module
- Recommendation Module
- Media Module

If you enable them, review their documentation for additional environment variables.

## Security Notes for Production

⚠️ **Before deploying to production:**

1. Change `JWT_SECRET` to a strong random value (min 32 characters)
2. Use strong database password
3. Set `REDIS_PASSWORD` for Redis authentication
4. Update `CORS_ORIGIN` to match your production frontend URL
5. Use production PostgreSQL server (not localhost)
6. Use production Redis server (not localhost)
7. Store all sensitive values in environment management service (AWS Secrets Manager, Heroku Config Vars, etc.)
