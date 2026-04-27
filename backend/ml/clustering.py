from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from scipy.cluster.hierarchy import dendrogram, linkage
from sklearn.cluster import AgglomerativeClustering, KMeans


class KMeansClustering:
    """Run K-Means clustering workflows and expose model artifacts."""

    def __init__(self, scaled_data: np.ndarray, k: int = 3) -> None:
        """Initialize with scaled feature data and a default number of clusters."""
        self._validate_scaled_data(scaled_data)
        if k < 1:
            raise ValueError("k must be at least 1.")

        self.scaled_data = scaled_data
        self.k = int(k)
        self.model: KMeans | None = None

    @staticmethod
    def _validate_scaled_data(scaled_data: np.ndarray) -> None:
        """Validate that clustering input is a non-empty 2D NumPy array."""
        if not isinstance(scaled_data, np.ndarray):
            raise TypeError("scaled_data must be a NumPy ndarray.")
        if scaled_data.ndim != 2:
            raise ValueError("scaled_data must be a 2D array with shape (n_samples, n_features).")
        if scaled_data.shape[0] == 0:
            raise ValueError("scaled_data must contain at least one sample.")

    def run_elbow(self, k_range: tuple[int, int] = (2, 10)) -> dict[str, Any]:
        """Compute WCSS over a k range and detect elbow via max second derivative."""
        if len(k_range) != 2:
            raise ValueError("k_range must be a tuple of two integers, e.g. (2, 10).")

        start_k, end_k = k_range
        if start_k < 1 or end_k <= start_k:
            raise ValueError("k_range must satisfy 1 <= start < end.")

        k_values = list(range(start_k, end_k))
        if len(k_values) < 3:
            raise ValueError(
                "k_range must include at least 3 k values for second-derivative elbow detection."
            )

        max_clusters = int(self.scaled_data.shape[0])
        if max(k_values) > max_clusters:
            raise ValueError(
                f"k values cannot exceed number of samples ({max_clusters})."
            )

        wcss: list[float] = []
        for k in k_values:
            model = KMeans(n_clusters=k, random_state=42, n_init=10)
            model.fit(self.scaled_data)
            wcss.append(float(model.inertia_))

        second_derivative = np.diff(np.asarray(wcss, dtype=float), n=2)
        elbow_index = int(np.argmax(second_derivative)) + 1
        optimal_k = int(k_values[elbow_index])

        return {
            "k_values": k_values,
            "wcss": wcss,
            "optimal_k": optimal_k,
        }

    def fit(self, k: int = 3) -> list[int]:
        """Fit K-Means model and return cluster labels."""
        if k < 1:
            raise ValueError("k must be at least 1.")

        sample_count = int(self.scaled_data.shape[0])
        if k > sample_count:
            raise ValueError(f"k ({k}) cannot exceed number of samples ({sample_count}).")

        try:
            model = KMeans(n_clusters=k, random_state=42, n_init=10)
            labels = model.fit_predict(self.scaled_data)
        except Exception as exc:
            raise ValueError(f"Failed to fit KMeans model: {exc}") from exc

        self.model = model
        self.k = int(k)
        return labels.astype(int).tolist()

    def get_centroids(self) -> list[list[float]]:
        """Return fitted K-Means centroids as a list of feature vectors."""
        if self.model is None:
            raise ValueError("KMeans model has not been fitted. Call fit() first.")
        return self.model.cluster_centers_.tolist()


class HierarchicalClustering:
    """Run agglomerative hierarchical clustering and prepare dendrogram data."""

    def __init__(self, scaled_data: np.ndarray) -> None:
        """Initialize with scaled feature data."""
        KMeansClustering._validate_scaled_data(scaled_data)
        self.scaled_data = scaled_data
        self.model: AgglomerativeClustering | None = None

    def run(self, n_clusters: int = 3, linkage_method: str = "ward") -> list[int]:
        """Fit AgglomerativeClustering and return cluster labels."""
        if n_clusters < 1:
            raise ValueError("n_clusters must be at least 1.")

        sample_count = int(self.scaled_data.shape[0])
        if n_clusters > sample_count:
            raise ValueError(
                f"n_clusters ({n_clusters}) cannot exceed number of samples ({sample_count})."
            )

        try:
            model = AgglomerativeClustering(
                n_clusters=n_clusters,
                linkage=linkage_method,
            )
            labels = model.fit_predict(self.scaled_data)
        except Exception as exc:
            raise ValueError(f"Failed to run hierarchical clustering: {exc}") from exc

        self.model = model
        return labels.astype(int).tolist()

    def get_dendrogram_data(self, sample_size: int = 60) -> dict[str, Any]:
        """Generate dendrogram plotting data from a random sample of observations."""
        if sample_size < 2:
            raise ValueError("sample_size must be at least 2.")

        data_df = pd.DataFrame(self.scaled_data)
        sample_n = min(sample_size, len(data_df))
        if sample_n < 2:
            raise ValueError("At least two samples are required to compute dendrogram data.")

        sampled_data = data_df.sample(n=sample_n, random_state=42).to_numpy()

        try:
            linkage_matrix = linkage(sampled_data, method="ward")
        except Exception as exc:
            raise ValueError(f"Failed to compute linkage matrix: {exc}") from exc

        threshold = float(0.7 * np.max(linkage_matrix[:, 2]))
        dendrogram_result = dendrogram(
            linkage_matrix,
            color_threshold=threshold,
            no_plot=True,
        )

        return {
            "icoord": [list(map(float, coords)) for coords in dendrogram_result["icoord"]],
            "dcoord": [list(map(float, coords)) for coords in dendrogram_result["dcoord"]],
            "color_list": list(dendrogram_result["color_list"]),
            "threshold": threshold,
        }