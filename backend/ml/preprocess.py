from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler


class DataPreprocessor:
    """Preprocess loan applicant data for clustering models."""

    REQUIRED_COLUMNS = (
        "Age",
        "Income",
        "LoanAmount",
        "CreditScore",
        "ExistingLoans",
        "EmploymentStatus",
    )

    def __init__(self, df: pd.DataFrame) -> None:
        """Initialize the preprocessor with a source DataFrame."""
        if not isinstance(df, pd.DataFrame):
            raise TypeError("DataPreprocessor expects a pandas DataFrame.")

        self._original_df = df.copy()
        self._cleaned_df: pd.DataFrame | None = None

    def validate_columns(self) -> None:
        """Validate that all required columns are present in the input DataFrame."""
        missing_columns = [
            column for column in self.REQUIRED_COLUMNS if column not in self._original_df.columns
        ]
        if missing_columns:
            required = ", ".join(self.REQUIRED_COLUMNS)
            missing = ", ".join(missing_columns)
            raise ValueError(
                f"Missing required columns: {missing}. Required columns are: {required}."
            )

    def clean(self) -> tuple[pd.DataFrame, dict[str, int]]:
        """Drop rows containing missing values and return cleaning statistics."""
        try:
            original_rows = int(len(self._original_df))
            cleaned_df = self._original_df.dropna().copy()
            cleaned_rows = int(len(cleaned_df))
            dropped_rows = original_rows - cleaned_rows
        except Exception as exc:
            raise ValueError(f"Failed to clean DataFrame: {exc}") from exc

        self._cleaned_df = cleaned_df
        stats = {
            "original_rows": original_rows,
            "cleaned_rows": cleaned_rows,
            "dropped_rows": dropped_rows,
        }
        return cleaned_df, stats

    def encode_and_scale(self) -> tuple[np.ndarray, dict[str, Any]]:
        """Encode employment status and scale all numeric features."""
        if self._cleaned_df is None:
            self.clean()

        if self._cleaned_df is None or self._cleaned_df.empty:
            raise ValueError("No data available after cleaning. Cannot encode and scale.")

        try:
            prepared_df = self._cleaned_df.copy()

            encoder = LabelEncoder()
            prepared_df["EmploymentStatus"] = encoder.fit_transform(
                prepared_df["EmploymentStatus"].astype(str)
            )
            encoding_map = {
                label: int(code) for code, label in enumerate(encoder.classes_)
            }

            numeric_columns = prepared_df.select_dtypes(include=[np.number]).columns.tolist()
            if not numeric_columns:
                raise ValueError("No numeric columns found to scale.")

            scaler = StandardScaler()
            scaled_array = scaler.fit_transform(prepared_df[numeric_columns])
        except ValueError:
            raise
        except Exception as exc:
            raise ValueError(f"Failed to encode and scale data: {exc}") from exc

        report = {
            "encoding_map": encoding_map,
            "features_scaled": numeric_columns,
        }
        return scaled_array, report

    def run_all(self) -> tuple[np.ndarray, pd.DataFrame, dict[str, Any]]:
        """Run full preprocessing: validate columns, clean rows, then encode and scale."""
        self.validate_columns()
        cleaned_df, cleaning_stats = self.clean()
        scaled_array, scaling_stats = self.encode_and_scale()

        preprocessing_report = {
            **cleaning_stats,
            **scaling_stats,
        }
        return scaled_array, cleaned_df, preprocessing_report