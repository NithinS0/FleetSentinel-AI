"""
FleetSentinel AI — Prediction Service
Consumes vehicle.features topic → runs ML model → publishes vehicle.predictions
"""

import asyncio
import json
import logging
import os
import pickle
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import numpy as np
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer

from ml.feature_vector import FeatureVector, build_feature_array
from ml.model_registry import ModelRegistry
from ml.anomaly_detector import AnomalyDetector
from ml.decision_engine import DecisionEngine
from ml.fingerprint_matcher import FingerprintMatcher

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
log = logging.getLogger("prediction-service")

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:29092")
KAFKA_FEATURES_TOPIC = os.getenv("KAFKA_TOPIC_FEATURES", "vehicle.features")
KAFKA_PREDICTIONS_TOPIC = os.getenv("KAFKA_TOPIC_PREDICTIONS", "vehicle.predictions")
KAFKA_GROUP_ID = os.getenv("KAFKA_GROUP_ID", "prediction-service")
MODEL_PATH = os.getenv("MODEL_PATH", "./models")


class PredictionService:
    def __init__(self):
        self.registry = ModelRegistry(MODEL_PATH)
        self.anomaly_detector = AnomalyDetector()
        self.decision_engine = DecisionEngine()
        self.fingerprint_matcher = FingerprintMatcher()
        self.consumer: Optional[AIOKafkaConsumer] = None
        self.producer: Optional[AIOKafkaProducer] = None
        self._processed = 0

    async def start(self):
        self.consumer = AIOKafkaConsumer(
            KAFKA_FEATURES_TOPIC,
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            group_id=KAFKA_GROUP_ID,
            value_deserializer=lambda v: json.loads(v.decode()),
            auto_offset_reset="latest",
            max_poll_records=500,
        )
        self.producer = AIOKafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode(),
            key_serializer=lambda k: k.encode() if k else None,
            acks="all",
        )
        await self.consumer.start()
        await self.producer.start()
        log.info("Prediction service started")

    async def stop(self):
        if self.consumer:
            await self.consumer.stop()
        if self.producer:
            await self.producer.stop()

    async def process_message(self, features: dict) -> dict:
        """Core prediction pipeline for one vehicle feature vector."""
        vehicle_id = features.get("vehicle_id", "unknown")
        tenant_id = features.get("tenant_id", "unknown")

        # 1. Build numpy feature array
        fv = build_feature_array(features)

        # 2. Anomaly detection
        anomaly_score = self.anomaly_detector.score(fv)
        is_anomalous = anomaly_score > 2.5

        # 3. Failure probability prediction
        model = self.registry.get_model("failure_predictor")
        if model:
            prob = float(model.predict_proba(fv.reshape(1, -1))[0][1])
        else:
            # Heuristic fallback when model not yet trained
            prob = min(0.95, anomaly_score * 0.3 + features.get("dtc_count_1h", 0) * 0.1)

        # 4. Failure type classification
        failure_type = "UNKNOWN"
        if prob > 0.4:
            classifier = self.registry.get_model("failure_classifier")
            if classifier:
                failure_type = classifier.predict(fv.reshape(1, -1))[0]
            else:
                failure_type = self._heuristic_failure_type(features)

        # 5. Fingerprint matching
        similar_fingerprints = self.fingerprint_matcher.find_similar(features, top_k=3)

        # 6. Risk level
        if prob >= 0.90:
            risk_level = "CRITICAL"
        elif prob >= 0.75:
            risk_level = "HIGH"
        elif prob >= 0.50:
            risk_level = "MEDIUM"
        elif prob >= 0.25:
            risk_level = "LOW"
        else:
            risk_level = "NORMAL"

        # 7. Expected failure window
        expected_window = self._estimate_window(prob, features)

        # 8. Evidence extraction
        evidence = self._build_evidence(features, anomaly_score)

        # 9. Recommended action
        recommendation = self.decision_engine.recommend(
            failure_type=failure_type,
            risk_level=risk_level,
            prob=prob,
            features=features,
        )

        # 10. Priority score (for fleet ranking)
        priority_score = self.decision_engine.priority_score(
            failure_prob=prob,
            failure_type=failure_type,
            odo_km=features.get("odo_km", 0),
            daily_km=features.get("daily_distance_km_7d", 100),
        )

        prediction = {
            "vehicle_id": vehicle_id,
            "tenant_id": tenant_id,
            "fleet_id": features.get("fleet_id"),
            "predicted_at": datetime.now(timezone.utc).isoformat(),
            "failure_type": failure_type,
            "failure_probability": round(prob, 4),
            "risk_level": risk_level,
            "expected_window": expected_window,
            "top_evidence": evidence,
            "anomaly_score": round(float(anomaly_score), 4),
            "is_anomalous": is_anomalous,
            "similar_fingerprints": similar_fingerprints,
            "recommended_action": recommendation,
            "priority_score": round(priority_score, 4),
            "model_version": self.registry.version,
        }
        return prediction

    def _heuristic_failure_type(self, features: dict) -> str:
        dtcs = features.get("dtc_codes", [])
        if any(d.startswith("P030") for d in dtcs):
            return "ENGINE_MISFIRE"
        if any(d.startswith("P011") or d.startswith("P012") for d in dtcs):
            return "COOLING_FAILURE"
        if any(d.startswith("P0A") for d in dtcs):
            return "BATTERY_DEGRADATION"
        if any(d.startswith("C00") for d in dtcs):
            return "BRAKE_ISSUE"
        if any(d.startswith("P07") for d in dtcs):
            return "TRANSMISSION_FAULT"
        engine_temp = features.get("engine_temp_avg_1h", 85)
        if engine_temp > 110:
            return "COOLING_FAILURE"
        return "GENERAL_FAULT"

    def _estimate_window(self, prob: float, features: dict) -> str:
        if prob >= 0.90:
            return "< 24 hours"
        elif prob >= 0.80:
            return "1–2 days"
        elif prob >= 0.70:
            return "2–4 days"
        elif prob >= 0.60:
            return "3–7 days"
        else:
            return "7–14 days"

    def _build_evidence(self, features: dict, anomaly_score: float) -> list:
        evidence = []
        temp = features.get("engine_temp_avg_1h", 85)
        if temp > 105:
            evidence.append(f"Engine temperature elevated: {temp:.1f}°C (normal <100°C)")
        dtc_count = features.get("dtc_count_1h", 0)
        if dtc_count > 0:
            dtcs = features.get("dtc_codes", [])
            evidence.append(f"Diagnostic codes present: {', '.join(dtcs[:3])}")
        rpm_variance = features.get("rpm_variance_1h", 0)
        if rpm_variance > 800:
            evidence.append(f"High RPM instability: variance={rpm_variance:.0f}")
        fuel_eff = features.get("fuel_efficiency_avg", 15)
        if fuel_eff < 10:
            evidence.append(f"Fuel efficiency degraded: {fuel_eff:.1f} km/l (normal >12)")
        if anomaly_score > 3.0:
            evidence.append(f"Strong multivariate anomaly detected (score={anomaly_score:.2f})")
        soh = features.get("soh_pct", 95)
        if soh < 75:
            evidence.append(f"Battery state of health low: {soh:.1f}%")
        harsh_brakes = features.get("harsh_brakes_24h", 0)
        if harsh_brakes > 5:
            evidence.append(f"Frequent harsh braking: {harsh_brakes} events in 24h")
        return evidence[:6]  # Top 6

    async def run(self):
        await self.start()
        log.info("Consuming from topic: " + KAFKA_FEATURES_TOPIC)

        async for message in self.consumer:
            try:
                features = message.value
                prediction = await self.process_message(features)

                await self.producer.send(
                    KAFKA_PREDICTIONS_TOPIC,
                    key=prediction["vehicle_id"],
                    value=prediction,
                )
                self._processed += 1

                if self._processed % 1000 == 0:
                    log.info(f"Predictions processed: {self._processed:,}")

            except Exception as e:
                log.error(f"Error processing message: {e}", exc_info=True)


async def main():
    service = PredictionService()
    try:
        await service.run()
    except KeyboardInterrupt:
        log.info("Shutting down...")
    finally:
        await service.stop()


if __name__ == "__main__":
    asyncio.run(main())
