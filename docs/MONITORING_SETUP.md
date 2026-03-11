# Monitoring Stack (Prometheus + Grafana)

This project includes a production-style local monitoring stack:

- Prometheus (metrics collection + alert rules)
- Grafana (dashboards)
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
- Backend metrics: http://localhost:3001/api/metrics

## 3) Grafana login

Credentials come from root `.env.local` / `.env`:

- `GRAFANA_ADMIN_USER`
- `GRAFANA_ADMIN_PASSWORD`

Defaults from `.env.example`:

- user: `admin`
- password: `change_me_grafana_password`

## 4) Pre-provisioned dashboard

A default dashboard is auto-loaded:

- **EduKids Monitoring Overview**

It includes:

- Backend health (`up`)
- Request rate
- 5xx error ratio
- P95 latency (global + by route)
- Container CPU & memory usage

## 5) Alert rules

Configured in:

- `docker/monitoring/prometheus/alerts.yml`

Current alerts:

- `BackendDown`
- `HighBackendLatencyP95`
- `HighBackend5xxRate`
- `PostgresExporterDown`
- `RedisExporterDown`

## 6) Metrics exposed by backend

The backend now exports:

- Default Node.js process/runtime metrics (prefixed `edukids_backend_`)
- HTTP request counter: `edukids_http_requests_total`
- HTTP request duration histogram: `edukids_http_request_duration_seconds`
- In-flight HTTP gauge: `edukids_http_requests_in_flight`

Notes:

- `/api/metrics` is excluded from request metrics to avoid self-scrape noise.
- Route labels use resolved route template when available.

## 7) Security notes

- Do not expose Grafana/Prometheus directly to the public internet without auth + network controls.
- Use strong `GRAFANA_ADMIN_PASSWORD` in non-local environments.
- Consider adding Alertmanager for real notification channels (Slack/Email/PagerDuty).
