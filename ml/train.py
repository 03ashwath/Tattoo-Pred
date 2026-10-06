import os

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "tattoo_price_dataset_v3.csv")
MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "saved_models", "price_prediction_model.joblib"
)

NUMERICAL_FEATURES = ["size_sq_inches", "complexity_score"]
CATEGORICAL_FEATURES = [
    "country",
    "city",
    "body_part",
    "tattoo_style",
    "color_type",
    "artist_level",
    "design_type",
]
MODEL_FEATURES = NUMERICAL_FEATURES + CATEGORICAL_FEATURES


def train_model() -> None:
    if not os.path.isfile(DATA_PATH):
        raise FileNotFoundError(
            f"Training dataset not found: {DATA_PATH}. "
            "Add tattoo_price_dataset_v3.csv to ml/data before training."
        )

    data = pd.read_csv(DATA_PATH)
    required_columns = {
        "country",
        "city",
        "placement",
        "style",
        "area_sq_in",
        "complexity_score",
        "color_type",
        "artist_level",
        "design_type",
        "price_usd",
    }
    missing_columns = required_columns.difference(data.columns)
    if missing_columns:
        raise ValueError(
            f"Training dataset is missing required columns: {sorted(missing_columns)}"
        )

    training_data = data.rename(
        columns={
            "area_sq_in": "size_sq_inches",
            "placement": "body_part",
            "style": "tattoo_style",
        }
    )
    training_data = training_data[MODEL_FEATURES + ["price_usd"]].copy()
    training_data["price_usd"] = pd.to_numeric(
        training_data["price_usd"], errors="coerce"
    )
    training_data = training_data.replace([np.inf, -np.inf], np.nan).dropna()
    training_data = training_data[training_data["price_usd"] > 0]
    if training_data.empty:
        raise ValueError("Training dataset has no valid positive USD prices.")

    features = training_data[MODEL_FEATURES]
    target = training_data["price_usd"]
    preprocessor = ColumnTransformer(
        transformers=[
            ("numeric", "passthrough", NUMERICAL_FEATURES),
            (
                "categorical",
                OneHotEncoder(handle_unknown="ignore"),
                CATEGORICAL_FEATURES,
            ),
        ]
    )
    model = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            (
                "model",
                RandomForestRegressor(
                    n_estimators=120,
                    min_samples_leaf=2,
                    max_features=0.8,
                    n_jobs=-1,
                    random_state=42,
                ),
            ),
        ]
    )

    X_train, X_test, y_train, y_test = train_test_split(
        features, target, test_size=0.2, random_state=42
    )
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    print(f"Training records: {len(training_data):,}")
    print(f"Mean absolute error (USD): {mean_absolute_error(y_test, predictions):.2f}")
    print(
        "Root mean squared error (USD): "
        f"{np.sqrt(mean_squared_error(y_test, predictions)):.2f}"
    )
    print(f"R-squared: {r2_score(y_test, predictions):.4f}")

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")


if __name__ == "__main__":
    train_model()
