"""
FleetSentinel AI — ML Training Pipeline
Trains Isolation Forest (anomaly) + XGBoost (failure prediction/classification).
"""

import json
import logging
import os
import pickle
from pathlib import Path
from typing import Tuple

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    classification_report,
    roc_auc_score,
    precision_recall_curve,
    average_precision_score,
)
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

try:
    import xgboost as xgb
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

log = logging.getLogger("ml.trainer")

MODEL_PATH = Path(os.getenv("MODEL_PATH", "./models"))
MODEL_PATH.mkdir(parents=True, exist_ok=True)

# Feature column names (must match FeatureVector)
FEATURE_COLUMNS = [
    "engine_temp_avg_1h",
    "engine_temp_trend_1h",
    "engine_temp_max_1h",
    "rpm_avg_1h",
    "rpm_variance_1h",
    "speed_avg_1h",
    "speed_max_1h",
    "fuel_efficiency_avg",
    "fuel_efficiency_trend",
    "soc_pct",
    "soh_pct",
    "odo_km",
    "dtc_count_1h",
    "dtc_count_24h",
    "anomaly_count_24h",
    "harsh_brakes_24h",
    "trips_7d",
    "daily_distance_km_7d",
    "vehicle_age_days",
    "maintenance_days_ago",
]

FAILURE_TYPES = [
    "ENGINE_MISFIRE",
    "COOLING_FAILURE",
    "BATTERY_DEGRADATION",
    "BRAKE_ISSUE",
    "SENSOR_FAULT",
    "TRANSMISSION_FAULT",
    "OIL_PRESSURE_LOW",
    "NORMAL",
]


def generate_synthetic_training_data(n_samples: int = 50000) -> pd.DataFrame:
    """
    Generate synthetic training data with labelled failure patterns.
    In production, this would be replaced with historical data from the DB.
    """
    np.random.seed(42)
    records = []

    # Healthy vehicles (60%)
    n_healthy = int(n_samples * 0.60)
    for _ in range(n_healthy):
        r = {
            "engine_temp_avg_1h": np.random.normal(88, 5),
            "engine_temp_trend_1h": np.random.normal(0, 0.5),
            "engine_temp_max_1h": np.random.normal(95, 5),
            "rpm_avg_1h": np.random.normal(2000, 300),
            "rpm_variance_1h": np.random.normal(200, 80),
            "speed_avg_1h": np.random.normal(55, 15),
            "speed_max_1h": np.random.normal(90, 15),
            "fuel_efficiency_avg": np.random.normal(14, 1.5),
            "fuel_efficiency_trend": np.random.normal(0, 0.2),
            "soc_pct": np.random.normal(70, 15),
            "soh_pct": np.random.normal(90, 5),
            "odo_km": np.random.uniform(1000, 100000),
            "dtc_count_1h": 0,
            "dtc_count_24h": 0,
            "anomaly_count_24h": np.random.randint(0, 2),
            "harsh_brakes_24h": np.random.randint(0, 3),
            "trips_7d": np.random.randint(3, 15),
            "daily_distance_km_7d": np.random.normal(120, 30),
            "vehicle_age_days": np.random.uniform(30, 2000),
            "maintenance_days_ago": np.random.uniform(0, 365),
            "failure_within_7d": 0,
            "failure_type": "NORMAL",
        }
        records.append(r)

    # Failure patterns (40% spread across types)
    failure_configs = [
        ("ENGINE_MISFIRE", {
            "engine_temp_avg_1h": (108, 8),
            "engine_temp_trend_1h": (2.5, 0.8),
            "rpm_variance_1h": (1200, 300),
            "fuel_efficiency_avg": (9, 2),
            "dtc_count_1h": 3,
            "dtc_count_24h": 8,
        }),
        ("COOLING_FAILURE", {
            "engine_temp_avg_1h": (118, 6),
            "engine_temp_trend_1h": (4.0, 1.0),
            "engine_temp_max_1h": (128, 5),
            "dtc_count_1h": 2,
        }),
        ("BATTERY_DEGRADATION", {
            "soh_pct": (68, 8),
            "soc_pct": (30, 15),
            "fuel_efficiency_trend": (-0.8, 0.3),
            "dtc_count_24h": 4,
        }),
        ("BRAKE_ISSUE", {
            "harsh_brakes_24h": 12,
            "dtc_count_1h": 1,
            "dtc_count_24h": 5,
            "anomaly_count_24h": 6,
        }),
        ("TRANSMISSION_FAULT", {
            "rpm_variance_1h": (1500, 400),
            "rpm_avg_1h": (2800, 400),
            "fuel_efficiency_avg": (10, 2),
            "dtc_count_24h": 6,
        }),
    ]

    n_per_fault = int(n_samples * 0.40 / len(failure_configs))

    for fault_type, overrides in failure_configs:
        for _ in range(n_per_fault):
            r = {
                "engine_temp_avg_1h": np.random.normal(88, 5),
                "engine_temp_trend_1h": np.random.normal(0, 0.5),
                "engine_temp_max_1h": np.random.normal(95, 5),
                "rpm_avg_1h": np.random.normal(2000, 300),
                "rpm_variance_1h": np.random.normal(200, 80),
                "speed_avg_1h": np.random.normal(55, 15),
                "speed_max_1h": np.random.normal(90, 15),
                "fuel_efficiency_avg": np.random.normal(14, 1.5),
                "fuel_efficiency_trend": np.random.normal(0, 0.2),
                "soc_pct": np.random.normal(70, 15),
                "soh_pct": np.random.normal(90, 5),
                "odo_km": np.random.uniform(1000, 100000),
                "dtc_count_1h": 0,
                "dtc_count_24h": 0,
                "anomaly_count_24h": np.random.randint(0, 2),
                "harsh_brakes_24h": np.random.randint(0, 3),
                "trips_7d": np.random.randint(3, 15),
                "daily_distance_km_7d": np.random.normal(120, 30),
                "vehicle_age_days": np.random.uniform(30, 2000),
                "maintenance_days_ago": np.random.uniform(0, 365),
                "failure_within_7d": 1,
                "failure_type": fault_type,
            }
            for key, val in overrides.items():
                if isinstance(val, tuple):
                    r[key] = np.random.normal(val[0], val[1])
                else:
                    r[key] = val + np.random.randint(0, 3)
            records.append(r)

    df = pd.DataFrame(records)
    # Clip realistic ranges
    df["engine_temp_avg_1h"] = df["engine_temp_avg_1h"].clip(60, 135)
    df["soc_pct"] = df["soc_pct"].clip(0, 100)
    df["soh_pct"] = df["soh_pct"].clip(50, 100)
    df["fuel_efficiency_avg"] = df["fuel_efficiency_avg"].clip(3, 25)
    df["rpm_variance_1h"] = df["rpm_variance_1h"].clip(0, 3000)

    return df.sample(frac=1).reset_index(drop=True)


def train_anomaly_detector(df: pd.DataFrame) -> IsolationForest:
    """Train Isolation Forest on healthy vehicle data only."""
    healthy = df[df["failure_within_7d"] == 0][FEATURE_COLUMNS].fillna(0)
    model = IsolationForest(
        n_estimators=200,
        contamination=0.05,
        max_features=0.8,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(healthy)
    log.info(f"Anomaly detector trained on {len(healthy):,} healthy samples")
    return model


def train_failure_predictor(df: pd.DataFrame) -> Pipeline:
    """Train XGBoost binary classifier for failure within 7 days."""
    X = df[FEATURE_COLUMNS].fillna(0).values
    y = df["failure_within_7d"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    if HAS_XGBOOST:
        clf = xgb.XGBClassifier(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            scale_pos_weight=(y == 0).sum() / (y == 1).sum(),
            use_label_encoder=False,
            eval_metric="logloss",
            random_state=42,
            n_jobs=-1,
        )
    else:
        clf = RandomForestClassifier(
            n_estimators=200,
            max_depth=8,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        )

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", clf),
    ])
    pipeline.fit(X_train, y_train)

    y_prob = pipeline.predict_proba(X_test)[:, 1]
    y_pred = pipeline.predict(X_test)

    roc_auc = roc_auc_score(y_test, y_prob)
    pr_auc = average_precision_score(y_test, y_prob)

    log.info(f"Failure predictor — ROC-AUC: {roc_auc:.4f} | PR-AUC: {pr_auc:.4f}")
    log.info("\n" + classification_report(y_test, y_pred))

    metrics = {
        "roc_auc": roc_auc,
        "pr_auc": pr_auc,
        "report": classification_report(y_test, y_pred, output_dict=True),
    }
    return pipeline, metrics


def train_failure_classifier(df: pd.DataFrame) -> Pipeline:
    """Train multi-class failure type classifier (only on faulty vehicles)."""
    faulty = df[df["failure_within_7d"] == 1].copy()
    X = faulty[FEATURE_COLUMNS].fillna(0).values
    y = faulty["failure_type"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", RandomForestClassifier(
            n_estimators=200,
            max_depth=8,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        )),
    ])
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    log.info("Failure classifier:\n" + classification_report(y_test, y_pred))
    return pipeline


def save_models(
    anomaly: IsolationForest,
    predictor: Pipeline,
    classifier: Pipeline,
    version: str = "v1.0",
):
    with open(MODEL_PATH / "anomaly_detector.pkl", "wb") as f:
        pickle.dump(anomaly, f)
    with open(MODEL_PATH / "failure_predictor.pkl", "wb") as f:
        pickle.dump(predictor, f)
    with open(MODEL_PATH / "failure_classifier.pkl", "wb") as f:
        pickle.dump(classifier, f)

    metadata = {
        "version": version,
        "feature_columns": FEATURE_COLUMNS,
        "failure_types": FAILURE_TYPES,
        "trained_at": str(pd.Timestamp.now()),
    }
    with open(MODEL_PATH / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
    log.info(f"Models saved to {MODEL_PATH}")


def main():
    logging.basicConfig(level=logging.INFO)
    log.info("Generating synthetic training data...")
    df = generate_synthetic_training_data(n_samples=100000)
    log.info(f"Dataset: {len(df):,} samples | Failure rate: {df['failure_within_7d'].mean():.1%}")

    log.info("Training anomaly detector...")
    anomaly_model = train_anomaly_detector(df)

    log.info("Training failure predictor...")
    predictor_model, predictor_metrics = train_failure_predictor(df)

    log.info("Training failure type classifier...")
    classifier_model = train_failure_classifier(df)

    log.info("Saving models...")
    save_models(anomaly_model, predictor_model, classifier_model)

    log.info("Training complete ✓")
    return predictor_metrics


if __name__ == "__main__":
    main()
