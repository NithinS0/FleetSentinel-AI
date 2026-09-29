"""
Unit Tests for Telemetry Vector Embedding & Cosine Similarity Matcher
"""

import math
import pytest


def cosine_similarity(v1: list[float], v2: list[float]) -> float:
    """Calculates cosine similarity between two multi-dimensional vectors."""
    if len(v1) != len(v2):
        raise ValueError(f"Vector dimensions do not match: {len(v1)} vs {len(v2)}")
    dot = sum(a * b for a, b in zip(v1, v2))
    norm_a = math.sqrt(sum(a * a for a in v1))
    norm_b = math.sqrt(sum(b * b for b in v2))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


# Representative 8-feature normalized prototype embeddings
# [dtc_misfire, temp_norm, rpm_variance, fuel_delta, soh_loss, cell_delta, brake_wear, oil_starve]
FINGERPRINT_ARCHETYPES = {
    "ENGINE_MISFIRE": [0.85, 0.78, 0.82, 0.45, 0.05, 0.02, 0.10, 0.15],
    "BATTERY_DEGRADATION": [0.10, 0.35, 0.05, 0.00, 0.90, 0.85, 0.05, 0.02],
    "COOLING_FAILURE": [0.20, 0.95, 0.15, 0.20, 0.10, 0.05, 0.05, 0.18],
    "BRAKE_ISSUE": [0.05, 0.20, 0.10, 0.05, 0.02, 0.02, 0.92, 0.05],
}


def test_identical_vector_similarity():
    v = [0.85, 0.78, 0.82, 0.45, 0.05, 0.02, 0.10, 0.15]
    sim = cosine_similarity(v, v)
    assert pytest.approx(sim, 0.0001) == 1.0


def test_orthogonal_vectors_zero_similarity():
    v1 = [1.0, 0.0, 0.0, 0.0]
    v2 = [0.0, 1.0, 0.0, 0.0]
    assert cosine_similarity(v1, v2) == 0.0


def test_hero_vehicle_matches_engine_misfire():
    # Observed telemetry embedding for TN01AB1234
    observed = [0.82, 0.81, 0.80, 0.42, 0.06, 0.03, 0.08, 0.14]

    scores = {
        name: cosine_similarity(observed, proto)
        for name, proto in FINGERPRINT_ARCHETYPES.items()
    }

    # Best match must be ENGINE_MISFIRE with similarity > 0.90
    best_match = max(scores, key=scores.get)
    assert best_match == "ENGINE_MISFIRE"
    assert scores["ENGINE_MISFIRE"] > 0.95
    assert scores["BATTERY_DEGRADATION"] < 0.35


def test_ev_matches_battery_degradation():
    # Observed telemetry embedding for KA04CD5678
    ev_observed = [0.12, 0.32, 0.04, 0.01, 0.88, 0.82, 0.04, 0.01]

    scores = {
        name: cosine_similarity(ev_observed, proto)
        for name, proto in FINGERPRINT_ARCHETYPES.items()
    }

    best_match = max(scores, key=scores.get)
    assert best_match == "BATTERY_DEGRADATION"
    assert scores["BATTERY_DEGRADATION"] > 0.95
