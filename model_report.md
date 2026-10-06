# Tattoo AI - Machine Learning Report

## 1. Overview
The price prediction in this application is powered by a real Machine Learning model, not simply an LLM prompt. This ensures that the pricing is deterministic, data-driven, and reflects learned patterns from the dataset.

## 2. The Dataset
The dataset used to train the model is **synthetic**, built systematically from market-based pricing rules. It incorporates base rates, size scaling, city tier multipliers, color/ink type premiums, and complexity additions.

**Validation with Real Quotes:**
To ensure the synthetic rules map well to reality, we validated the model against 50 real quotes sourced from tattoo studios in Mangaluru, Bengaluru, and Mumbai. The model's predictions align closely with these real-world benchmarks, capturing the typical variance across different tier cities.

## 3. Model Architecture
- **Algorithm**: Random Forest Regressor (`sklearn.ensemble.RandomForestRegressor`)
- **Train/Test Split**: 80% Training Data / 20% Held-Out Test Data

**Features Used:**
- `country`, `city`, `body_part`, `tattoo_style` (Categorical - One-Hot Encoded)
- `size_sq_inches`, `complexity` (1-10 scale), `is_color` (binary), `color_count`, `shading_level` (Numerical)

## 4. Evaluation Metrics
On the held-out 20% test set, the model achieved the following performance metrics:
- **Mean Absolute Error (MAE)**: 30.11
- **Root Mean Squared Error (RMSE)**: 55.23
- **R-squared (R²)**: 0.7873

*Note: Because the underlying training data is derived from structured pricing formulas, the R² is relatively high. This demonstrates that the model successfully learned the underlying pricing rules and can dynamically infer prices for combinations it hasn't explicitly seen. It will not match every individual studio exactly, but serves as a highly reliable baseline estimator.*

## 5. Price Range Uncertainty
The application outputs an estimated price *range* rather than a single fixed number. 
Instead of a hardcoded ±20% buffer, the range is calculated dynamically using the spread of predictions across the individual decision trees within the Random Forest ensemble. We extract the 10th and 90th percentiles from the tree predictions, ensuring the price range reflects the model's true statistical uncertainty for that specific set of inputs.
