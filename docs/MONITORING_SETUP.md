# Monitoring Stack (Prometheus + Grafana)

This project includes a production-style local monitoring stack:

- Prometheus (metrics collection + alert rules)
- Grafana (dashboards)
- Alertmanager (alert routing)
- Blackbox Exporter (HTTP endpoint probes)
- Node Exporter (host metrics)
- cAdvisor (container metrics)
- Postgres Exporter (database metrics)
- Redis Exporter (cache metrics)
- Backend custom Prometheus endpoint at `/api/metrics`

## 1) Start monitoring services

From the project root:

```bash
docker compose up -d prometheus grafana node-exporter cadvisor postgres-exporter redis-exporter
```

Or start everything:

```bash
docker compose up -d
```

## 2) Access URLs

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3003
- Alertmanager: http://localhost:9093
- Blackbox Exporter: http://localhost:9115
- Backend metrics: http://localhost:3001/api/metrics

> In compose, monitoring ports are bound to `127.0.0.1` for safer local defaults.

## 3) Grafana login

Credentials come from root `.env.local` / `.env`:

- `GRAFANA_ADMIN_USER`
- `GRAFANA_ADMIN_PASSWORD`

Defaults from `.env.example`:

- user: `admin`
- password: `change_me_grafana_password`

## 4) Pre-provisioned dashboard

Default dashboards are auto-loaded:

- **EduKids Monitoring Overview**
- **EduKids SLO & Infra**

It includes:

- Backend health (`up`)
- Request rate
- 5xx error ratio
- P95 latency (global + by route)
- Container CPU & memory usage
- Endpoint probe success/duration
- Redis and Postgres basic health signals

## 5) Alert rules

Configured in:

- `docker/monitoring/prometheus/alerts.yml`
- `docker/monitoring/prometheus/recording.rules.yml`
- `docker/monitoring/alertmanager/alertmanager.yml`

Current alerts:

- `BackendDown`
- `HighBackendLatencyP95`
- `HighBackend5xxRate`
- `PostgresExporterDown`
- `RedisExporterDown`
- `FrontendProbeDown`
- `BackendHealthProbeDown`
- `HighContainerMemoryUsage`

## 6) Metrics exposed by backend

The backend now exports:

- Default Node.js process/runtime metrics (prefixed `edukids_backend_`)
- HTTP request counter: `edukids_http_requests_total`
- HTTP request duration histogram: `edukids_http_request_duration_seconds`
- In-flight HTTP gauge: `edukids_http_requests_in_flight`

Notes:

- `/api/metrics` is excluded from request metrics to avoid self-scrape noise.
- Route labels use resolved route template when available.

## 7) Build/runtime optimization done

- Backend image uses multi-stage build with separate dev/prod dependency layers.
- Frontend image uses multi-stage build and ships only built app + production dependencies.
- Compose now runs backend/frontend in production mode by default (lighter, stable runtime).
- Monitoring services use `restart: unless-stopped`.

## 8) Security notes

- Do not expose Grafana/Prometheus directly to the public internet without auth + network controls.
- Use strong `GRAFANA_ADMIN_PASSWORD` in non-local environments.
- Configure Alertmanager receivers (Slack/Email/PagerDuty/Telegram) before production use.
