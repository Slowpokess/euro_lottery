# Monitoring Setup Instructions

This document explains how to set up the monitoring infrastructure for the Euro Lottery application.

## Prerequisites

- Docker and Docker Compose installed
- The Euro Lottery backend application running

## Setup Steps

1. **Create Required Directories**

   Ensure that the monitoring directory structure exists:

   ```bash
   mkdir -p backend/monitoring/prometheus
   mkdir -p backend/monitoring/rules
   mkdir -p backend/monitoring/alertmanager/templates
   mkdir -p backend/monitoring/grafana/dashboards
   mkdir -p backend/monitoring/grafana/datasources
   mkdir -p backend/monitoring/loki
   mkdir -p backend/monitoring/promtail
   mkdir -p backend/monitoring/jaeger
   ```

2. **Configure the Application for Monitoring**

   - Ensure the application has structured logging configured
   - Make sure all necessary directories for logs exist
   - Update Docker Compose files to expose metrics endpoints

3. **Start the Monitoring Stack**

   ```bash
   docker-compose -f docker-compose.monitoring.yml up -d
   ```

4. **Integrate with the Main Application**

   To integrate the monitoring stack with the main application, you can use a combined Docker Compose setup. Create a `docker-compose.combined.yml` file:

   ```yaml
   version: '3.8'

   services:
     # Include your existing app services here
     web:
       # Your web service configuration
       # ...
       logging:
         driver: "json-file"
         options:
           max-size: "10m"
           max-file: "3"
       labels:
         - "prometheus.io/scrape=true"
         - "prometheus.io/port=8000"
         - "prometheus.io/path=/metrics"

     # Include all services from docker-compose.monitoring.yml
     prometheus:
       extends:
         file: docker-compose.monitoring.yml
         service: prometheus
       networks:
         - monitoring
         - default

     alertmanager:
       extends:
         file: docker-compose.monitoring.yml
         service: alertmanager
       networks:
         - monitoring
         - default

     grafana:
       extends:
         file: docker-compose.monitoring.yml
         service: grafana
       networks:
         - monitoring
         - default

     loki:
       extends:
         file: docker-compose.monitoring.yml
         service: loki
       networks:
         - monitoring
         - default

     promtail:
       extends:
         file: docker-compose.monitoring.yml
         service: promtail
       networks:
         - monitoring
         - default

     jaeger:
       extends:
         file: docker-compose.monitoring.yml
         service: jaeger
       networks:
         - monitoring
         - default

   networks:
     default:
       # Your default network configuration
     monitoring:
       driver: bridge
   ```

   Start the combined services:

   ```bash
   docker-compose -f docker-compose.combined.yml up -d
   ```

5. **Access the Monitoring Services**

   - Prometheus: http://localhost:9090
   - AlertManager: http://localhost:9093
   - Grafana: http://localhost:3000 (admin/eurolottery123)
   - Loki: http://localhost:3100
   - Jaeger UI: http://localhost:16686

6. **Configure Grafana Dashboards**

   - Log in to Grafana
   - Go to Dashboards > Import
   - Upload the dashboard JSON files from the `monitoring/grafana/dashboards` directory

## Monitoring System Overview

- **Prometheus**: Collects metrics from the application and infrastructure
- **AlertManager**: Manages alerts and notifications
- **Grafana**: Visualizes metrics and provides dashboards
- **Loki**: Aggregates and indexes logs
- **Promtail**: Collects logs and sends them to Loki
- **Jaeger**: Provides distributed tracing capabilities

## Troubleshooting

- Check container logs if a service isn't working:
  ```bash
  docker-compose -f docker-compose.monitoring.yml logs <service_name>
  ```

- Verify Prometheus targets:
  http://localhost:9090/targets

- Ensure log directories have proper permissions:
  ```bash
  chmod -R 755 /path/to/log/directories
  ```

- If you're having issues with Loki, check the configuration:
  ```bash
  docker-compose -f docker-compose.monitoring.yml exec loki loki -config.file=/etc/loki/loki-config.yaml -log.level=debug
  ```

## Maintenance

- Back up monitoring data regularly
- Update monitoring configurations as the application evolves
- Review alerts and thresholds periodically to reduce false positives
- Monitor the disk space used by logs and metrics