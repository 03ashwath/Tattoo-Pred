"""Prepare the tattoo pricing dataset for model training.

Keeps the raw v3 dataset unchanged and creates a prediction-time dataset
containing only features available before a price is known.
"""

from pathlib import Path

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
SOURCE = DATA_DIR / "tattoo_price_dataset_v3.csv"
OUTPUT = DATA_DIR / "tattoo_price_model_ready_v4.csv"

FEATURES = [
    "area_sq_in",
    "placement",
    "country",
    "city",
    "style",
    "complexity_score",
    "color_type",
    "artist_level",
    "design_type",
]
TARGET = "price_usd"


def prepare_dataset(source=SOURCE, output=OUTPUT):
    df = pd.read_csv(source)
    required = FEATURES + [TARGET]
    missing = [column for column in required if column not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    out = df[required].copy()

    for column in [
        "placement",
        "country",
        "city",
        "style",
        "color_type",
        "artist_level",
        "design_type",
    ]:
        out[column] = out[column].astype("string").str.strip()

    for column in ["area_sq_in", "complexity_score", TARGET]:
        out[column] = pd.to_numeric(out[column], errors="coerce")

    out = out.replace([np.inf, -np.inf], np.nan).dropna()
    out = out[
        (out["area_sq_in"] > 0)
        & out["complexity_score"].between(1, 5)
        & (out[TARGET] > 0)
    ].drop_duplicates().reset_index(drop=True)

    output.parent.mkdir(parents=True, exist_ok=True)
    out.to_csv(output, index=False)
    print(f"Prepared {len(out):,} rows -> {output}")


if __name__ == "__main__":
    prepare_dataset()
