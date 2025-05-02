# Euro Lottery Load Testing

This directory contains load testing configuration using [Locust](https://locust.io/), an open-source load testing tool.

## Installation

```bash
pip install locust
```

## Running Tests

To start the Locust web interface:

```bash
cd /Users/macbook/Documents/euro_lottery/backend
locust -f load_tests/locustfile.py
```

Then open http://localhost:8089 in your browser.

## Test Scenarios

The load tests simulate:

1. Regular users:
   - Viewing lottery games
   - Viewing upcoming draws
   - Viewing draw results
   - Checking their tickets
   - Purchasing tickets
   - Viewing lottery statistics
   - Checking for winning tickets

2. Admin users:
   - Conducting draws

## Test Configuration

When running the tests, you'll need to specify:

1. Number of users to simulate
2. Spawn rate (users started per second)
3. Host URL (e.g., http://localhost:8000)

## Interpreting Results

Locust provides real-time statistics on:

- Request count and failure rate
- Response time (min, max, average, median)
- Current throughput (requests per second)

## Test Parameters

For comprehensive testing, consider:

1. **Basic Load Test**: 50 users, 10 users/second
2. **Stress Test**: Gradually increase to 500 users
3. **Spike Test**: Quickly jump to 1000 users
4. **Endurance Test**: 100 users for 1 hour

## Recommended Thresholds

- **Response Time**: < 500ms for 95% of requests
- **Error Rate**: < 1%
- **Throughput**: Depends on hardware, but aim for at least 100 req/sec

## Notes

- Before running tests on production, make sure to use test database or sandbox accounts
- Disable emails/notifications during load testing
- Monitor server resources during testing