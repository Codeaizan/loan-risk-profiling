from __future__ import annotations

import io
from typing import Any

import numpy as np
import pandas as pd
from fastapi import APIRouter, File, Query, UploadFile
from fastapi.responses import JSONResponse

from .clustering import HierarchicalClustering, KMeansClustering
from .evaluate import ClusterEvaluator
from .preprocess import DataPreprocessor

router = APIRouter(prefix="/api", tags=["ML"])


@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    k: int = Query(default=3),
) -> Any:
    """Upload a CSV file, run preprocessing and clustering, and return analysis artifacts."""
    try:
        if k < 2:
            raise ValueError("k must be at least 2.")

        if not file.filename:
            raise ValueError("No file name provided.")
        if not file.filename.lower().endswith(".csv"):
            raise ValueError("Uploaded file must be a CSV file.")

        file_bytes = await file.read()
        if not file_bytes:
            raise ValueError("Uploaded CSV file is empty.")

        try:
            dataframe = pd.read_csv(io.BytesIO(file_bytes))
        except pd.errors.EmptyDataError as exc:
            raise ValueError("Uploaded CSV file is empty.") from exc
        except pd.errors.ParserError as exc:
            raise ValueError("Failed to parse CSV file. Please upload a valid CSV.") from exc

        if dataframe.empty:
            raise ValueError("Uploaded CSV has no data rows.")

        preprocessor = DataPreprocessor(dataframe)
        scaled_array, cleaned_df, preprocessing_report = preprocessor.run_all()

        kmeans = KMeansClustering(scaled_array=scaled_array, k=k)
        elbow_data = kmeans.run_elbow()
        kmeans_labels = kmeans.fit(k=k)

        hierarchical = HierarchicalClustering(scaled_data=scaled_array)
        hierarchical_labels = hierarchical.run(n_clusters=k)
        dendrogram_data = hierarchical.get_dendrogram_data()

        evaluator = ClusterEvaluator(scaled_data=scaled_array, labels=np.asarray(kmeans_labels))
        metrics = evaluator.compute_metrics()
        pca_data = evaluator.pca_projection()
        profiles = evaluator.cluster_profiles(cleaned_df, np.asarray(kmeans_labels))

        return {
            "preprocessing": preprocessing_report,
            "elbow": elbow_data,
            "kmeans_labels": kmeans_labels,
            "hierarchical_labels": hierarchical_labels,
            "dendrogram": dendrogram_data,
            "metrics": metrics,
            "pca": pca_data,
            "profiles": profiles,
        }
    except (TypeError, ValueError) as exc:
        return JSONResponse(status_code=400, content={"error": str(exc)})
    except Exception as exc:
        return JSONResponse(status_code=500, content={"error": f"Internal server error: {exc}"})
    finally:
        await file.close()


@router.get("/sample-data")
async def get_sample_data() -> Any:
    """Return a deterministic synthetic loan applicant dataset for testing."""
    try:
        np.random.seed(42)
        employment_statuses = ["Employed", "Self-Employed", "Unemployed"]

        group_0 = pd.DataFrame(
            {
                "Age": np.random.randint(30, 56, size=80),
                "Income": np.random.randint(70000, 120001, size=80),
                "LoanAmount": np.random.randint(5000, 20001, size=80),
                "CreditScore": np.random.randint(720, 851, size=80),
                "ExistingLoans": np.random.randint(0, 2, size=80),
            }
        )

        group_1 = pd.DataFrame(
            {
                "Age": np.random.randint(25, 46, size=70),
                "Income": np.random.randint(35000, 70001, size=70),
                "LoanAmount": np.random.randint(20000, 50001, size=70),
                "CreditScore": np.random.randint(600, 721, size=70),
                "ExistingLoans": np.random.randint(1, 3, size=70),
            }
        )

        group_2 = pd.DataFrame(
            {
                "Age": np.random.randint(22, 41, size=50),
                "Income": np.random.randint(15000, 35001, size=50),
                "LoanAmount": np.random.randint(50000, 100001, size=50),
                "CreditScore": np.random.randint(400, 601, size=50),
                "ExistingLoans": np.random.randint(2, 5, size=50),
            }
        )

        dataset = pd.concat([group_0, group_1, group_2], ignore_index=True)
        dataset["EmploymentStatus"] = np.random.choice(employment_statuses, size=len(dataset))

        return {
            "data": dataset.to_dict(orient="records"),
            "columns": dataset.columns.tolist(),
        }
    except Exception as exc:
        return JSONResponse(status_code=500, content={"error": f"Internal server error: {exc}"})


@router.get("/health")
async def health_check() -> Any:
    """Report service health and API version."""
    try:
        return {"status": "healthy", "version": "1.0.0"}
    except Exception as exc:
        return JSONResponse(status_code=500, content={"error": f"Internal server error: {exc}"})