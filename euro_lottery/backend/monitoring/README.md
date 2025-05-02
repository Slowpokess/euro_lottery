# Euro Lottery Monitoring System

This document provides an overview of the monitoring infrastructure for the Euro Lottery application.

## Components

The monitoring system consists of the following components:

1. **Prometheus** - Collects and stores metrics from all services
2. **AlertManager** - Processes alerts and sends notifications
3. **Grafana** - Visualizes metrics and provides dashboards
4. **Loki** - Aggregates and indexes logs
5. **Promtail** - Collects logs and sends them to Loki
6. **Jaeger** - Provides distributed tracing capabilities

## Getting Started

To start the monitoring infrastructure, run:

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

This will start all monitoring services in detached mode.

## Access Points

- Prometheus: http://localhost:9090
- AlertManager: http://localhost:9093
- Grafana: http://localhost:3000 (admin/eurolottery123)
- Loki: http://localhost:3100
- Jaeger UI: http://localhost:16686

## Metrics Collection

Prometheus is configured to scrape metrics from:
- Backend service (Django)
- Celery workers
- Database (PostgreSQL)
- Redis
- Nginx

## Alerting

Alerts are defined in `prometheus.yml` and `alert_rules.yml`. When triggered, alerts are sent to AlertManager, which handles notification routing.

Notification channels:
- Email
- Slack

## Logging

Logs are collected by Promtail and sent to Loki. The logs can be viewed and queried in Grafana.

## Tracing

Jaeger provides distributed tracing for the application. Trace information can be viewed in the Jaeger UI.

## Dashboard

Grafana is pre-configured with dashboards for:
- System overview
- Application performance
- Error rates
- Lottery draw statistics
- Database performance

## Maintenance

### Backing Up Monitoring Data

Prometheus, Loki, and Grafana data are stored in Docker volumes. To back up these volumes:

```bash
docker run --rm -v euro-lottery_prometheus_data:/source -v /path/to/backup:/backup alpine tar czf /backup/prometheus-backup.tar.gz /source
docker run --rm -v euro-lottery_grafana_data:/source -v /path/to/backup:/backup alpine tar czf /backup/grafana-backup.tar.gz /source
docker run --rm -v euro-lottery_loki_data:/source -v /path/to/backup:/backup alpine tar czf /backup/loki-backup.tar.gz /source
```

### Updating Monitoring Configuration

To update the monitoring configuration:

1. Modify the configuration files in the respective directories
2. Restart the affected service:

```bash
docker-compose -f docker-compose.monitoring.yml restart <service_name>
```

For Prometheus, you can also reload the configuration without restart:

```bash
curl -X POST http://localhost:9090/-/reload
```

## Troubleshooting

### Common Issues

1. **No metrics data in Grafana**
   - Check if Prometheus is running: `docker-compose -f docker-compose.monitoring.yml ps prometheus`
   - Verify Prometheus targets: http://localhost:9090/targets
   - Check Grafana datasource configuration

2. **No logs in Loki**
   - Check if Promtail is running: `docker-compose -f docker-compose.monitoring.yml ps promtail`
   - Verify Promtail configuration
   - Check if the log paths in Promtail configuration match the actual log locations

3. **No alerts being sent**
   - Check AlertManager status: http://localhost:9093/#/status
   - Verify alert rules in Prometheus: http://localhost:9090/rules
   - Check notification channel configuration in AlertManager