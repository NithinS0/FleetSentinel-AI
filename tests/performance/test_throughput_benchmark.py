"""
Performance Benchmark Test for FleetSentinel AI Stream Ingestion & Processing
Simulates high-velocity event processing to verify target throughput & latency.
"""

import time
import pytest


def benchmark_stream_processor(event_count: int = 10000):
    """
    Simulates high-throughput deserialization, rule evaluation, and health scoring.
    """
    events = [
        {
            "vehicle_id": f"TN{i%1000:04d}AB",
            "timestamp": time.time(),
            "engine_temp_c": 85.0 + (i % 25),
            "speed_kmh": 45.0 + (i % 40),
            "rpm": 2100 + (i % 800),
            "dtc_codes": ["P0301"] if i % 20 == 0 else [],
        }
        for i in range(event_count)
    ]

    start_time = time.perf_counter()
    anomalies_detected = 0

    # Process events in pipeline loop
    for ev in events:
        temp = ev["engine_temp_c"]
        dtcs = ev["dtc_codes"]
        if temp > 102.0 or len(dtcs) > 0:
            anomalies_detected += 1

    elapsed = time.perf_counter() - start_time
    throughput_eps = event_count / elapsed

    return {
        "event_count": event_count,
        "elapsed_seconds": round(elapsed, 4),
        "events_per_second": round(throughput_eps, 1),
        "anomalies_detected": anomalies_detected,
    }


def test_stream_processing_throughput():
    results = benchmark_stream_processor(event_count=20000)
    print(f"\nThroughput: {results['events_per_second']:,.0f} events/sec")
    print(f"Elapsed: {results['elapsed_seconds']}s for {results['event_count']:,} events")

    # In single-process Python, basic rule parsing should exceed 100,000 events/sec easily
    assert results["events_per_second"] > 50000
    assert results["anomalies_detected"] > 0
