from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.metrics import davies_bouldin_score, silhouette_score


class ClusterEvaluator:
    """Evaluate clustering output and prepare visualization-ready artifacts."""

    def __init__(self, scaled_data: np.ndarray, labels: np.ndarray) -> None:
        """Initialize evaluator with scaled features and predicted cluster labels."""
        if not isinstance(scaled_data, np.ndarray):
            raise TypeError("scaled_data must be a NumPy ndarray.")
        if scaled_data.ndim != 2:
            raise ValueError("scaled_data must be a 2D array with shape (n_samples, n_features).")
        if scaled_data.shape[0] == 0:
            raise ValueError("scaled_data must contain at least one sample.")

        labels_array = np.asarray(labels)
        if labels_array.ndim != 1:
            raise ValueError("labels must be a 1D array-like object.")
        if labels_array.shape[0] != scaled_data.shape[0]:
            raise ValueError("labels length must match number of rows in scaled_data.")

        self.scaled_data = scaled_data
        self.labels = labels_array.astype(int)

    def compute_metrics(self) -> dict[str, Any]:
        """Compute clustering quality metrics and per-cluster population sizes."""
        unique_labels, counts = np.unique(self.labels, return_counts=True)
        n_clusters = int(len(unique_labels))
        cluster_sizes = {
            str(int(cluster_id)): int(count)
            for cluster_id, count in zip(unique_labels, counts)
        }

        if n_clusters < 2:
            raise ValueError("At least 2 clusters are required to compute clustering metrics.")

        if n_clusters >= self.scaled_data.shape[0]:
            raise ValueError(
                "Number of clusters must be less than number of samples for silhouette score."
            )

        try:
            sil_score = float(silhouette_score(self.scaled_data, self.labels))
            db_index = float(davies_bouldin_score(self.scaled_data, self.labels))
        except Exception as exc:
            raise ValueError(f"Failed to compute clustering metrics: {exc}") from exc

        return {
            "silhouette_score": round(sil_score, 4),
            "davies_bouldin_index": round(db_index, 4),
            "n_clusters": n_clusters,
            "cluster_sizes": cluster_sizes,
        }

    def pca_projection(self) -> dict[str, Any]:
        """Project scaled data to 2D for scatter plot visualizations."""
        try:
            pca = PCA(n_components=2)
            projected = pca.fit_transform(self.scaled_data)
        except Exception as exc:
            raise ValueError(f"Failed to compute PCA projection: {exc}") from exc

        points = [
            {
                "x": float(point[0]),
                "y": float(point[1]),
                "cluster": int(label),
            }
            for point, label in zip(projected, self.labels)
        ]

        explained_variance = [
            float(pca.explained_variance_ratio_[0]),
            float(pca.explained_variance_ratio_[1]),
        ]

        return {
            "points": points,
            "explained_variance": explained_variance,
        }

    def cluster_profiles(self, original_df: pd.DataFrame, labels: np.ndarray) -> dict[str, Any]:
        """Build per-cluster summary profiles and assign risk labels."""
        if not isinstance(original_df, pd.DataFrame):
            raise TypeError("original_df must be a pandas DataFrame.")

        labels_array = np.asarray(labels)
        if labels_array.ndim != 1:
            raise ValueError("labels must be a 1D array-like object.")
        if labels_array.shape[0] != len(original_df):
            raise ValueError("labels length must match number of rows in original_df.")

        required_columns = ["Income", "LoanAmount", "CreditScore", "Age", "ExistingLoans"]
        missing_columns = [col for col in required_columns if col not in original_df.columns]
        if missing_columns:
            raise ValueError(
                f"Missing required columns for cluster profiling: {', '.join(missing_columns)}."
            )

        try:
            profile_df = original_df.copy()
            profile_df["_cluster"] = labels_array.astype(int)

            grouped = profile_df.groupby("_cluster", sort=True)

            cluster_rows: list[dict[str, Any]] = []
            for cluster_id, cluster_frame in grouped:
                avg_income = float(cluster_frame["Income"].mean())
                avg_loan_amount = float(cluster_frame["LoanAmount"].mean())
                avg_credit_score = float(cluster_frame["CreditScore"].mean())
                avg_age = float(cluster_frame["Age"].mean())
                avg_existing_loans = float(cluster_frame["ExistingLoans"].mean())

                loan_income_ratio = (
                    avg_loan_amount / avg_income if avg_income != 0 else float("inf")
                )

                cluster_rows.append(
                    {
                        "id": int(cluster_id),
                        "size": int(len(cluster_frame)),
                        "avg_income": round(avg_income, 2),
                        "avg_loan_amount": round(avg_loan_amount, 2),
                        "avg_credit_score": round(avg_credit_score, 2),
                        "avg_age": round(avg_age, 2),
                        "avg_existing_loans": round(avg_existing_loans, 2),
                        "_credit_score_raw": avg_credit_score,
                        "_loan_income_ratio_raw": loan_income_ratio,
                    }
                )
        except Exception as exc:
            raise ValueError(f"Failed to compute cluster profiles: {exc}") from exc

        if not cluster_rows:
            return {"clusters": []}

        # Low risk: highest credit score and lowest loan-to-income ratio.
        low_risk_id = sorted(
            cluster_rows,
            key=lambda row: (
                -row["_credit_score_raw"],
                row["_loan_income_ratio_raw"],
                row["id"],
            ),
        )[0]["id"]

        # High risk: lowest credit score and highest loan-to-income ratio.
        high_risk_candidates = sorted(
            cluster_rows,
            key=lambda row: (
                row["_credit_score_raw"],
                -row["_loan_income_ratio_raw"],
                row["id"],
            ),
        )
        high_risk_id = high_risk_candidates[0]["id"]
        if high_risk_id == low_risk_id and len(high_risk_candidates) > 1:
            high_risk_id = high_risk_candidates[1]["id"]

        result_clusters: list[dict[str, Any]] = []
        for row in sorted(cluster_rows, key=lambda value: value["id"]):
            if len(cluster_rows) == 1:
                risk_label = "Medium Risk"
            elif row["id"] == low_risk_id:
                risk_label = "Low Risk"
            elif row["id"] == high_risk_id:
                risk_label = "High Risk"
            else:
                risk_label = "Medium Risk"

            result_clusters.append(
                {
                    "id": row["id"],
                    "risk_label": risk_label,
                    "size": row["size"],
                    "avg_income": row["avg_income"],
                    "avg_loan_amount": row["avg_loan_amount"],
                    "avg_credit_score": row["avg_credit_score"],
                    "avg_age": row["avg_age"],
                    "avg_existing_loans": row["avg_existing_loans"],
                }
            )

        return {"clusters": result_clusters}