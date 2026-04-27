# Loan Applicant Risk Profiling Using Unsupervised Learning

This project builds an end-to-end web application to segment loan applicants into risk groups using unsupervised machine learning.
It combines a FastAPI backend and a Next.js frontend to preprocess CSV data, run clustering models, and visualize risk insights.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, Recharts, lucide-react |
| Backend | FastAPI, Uvicorn, Python-dotenv, CORS Middleware |
| ML | pandas, numpy, scikit-learn, scipy, matplotlib |
| Deployment | Local development setup (Next.js + Uvicorn), cloud-ready architecture |

## Project Structure

```text
loan-risk-profiling/
├── backend/
│   ├── .env
│   ├── main.py
│   ├── requirements.txt
│   └── ml/
│       ├── __init__.py
│       ├── preprocess.py
│       ├── clustering.py
│       ├── evaluate.py
│       └── routes.py
└── frontend/
    ├── .env.local
    ├── package.json
    ├── app/
    │   ├── page.tsx
    │   └── dashboard/
    │       └── page.tsx
    ├── components/
    │   ├── UploadPanel.tsx
    │   ├── RiskTable.tsx
    │   ├── ElbowChart.tsx
    │   ├── ClusterChart.tsx
    │   ├── Dendrogram.tsx
    │   └── PreprocessingSummary.tsx
    └── lib/
        └── api.ts
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+

### Backend Setup

```bash
cd backend
python -m venv .venv
```

```bash
# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate
```

```bash
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

| Method | Path | Description |
| --- | --- | --- |
| POST | /api/upload | Upload a CSV file, preprocess data, run clustering, and return metrics + visualization payloads |
| GET | /api/sample-data | Return a synthetic loan applicant dataset for quick testing |
| GET | /api/health | Health check endpoint with API status/version |

## How It Works

- Upload a loan applicant CSV file or use the built-in sample dataset.
- Preprocess data with cleaning, categorical encoding, and feature scaling.
- Run K-Means and Hierarchical Clustering to segment applicants into clusters.
- Evaluate cluster quality and visualize outputs (elbow chart, PCA scatter, dendrogram, risk summaries).

## Dataset

The backend provides a synthetic dataset with 200 rows and 6 columns:
Age, Income, LoanAmount, CreditScore, ExistingLoans, EmploymentStatus.
It is generated with three risk-like population groups to simulate low, medium, and high risk applicant patterns.

## Evaluation Metrics

- Silhouette Score: Measures cluster separation and cohesion (higher is better).
- Davies-Bouldin Index: Measures average similarity between clusters (lower is better).
- WCSS (Within-Cluster Sum of Squares): Used in the elbow method to select an optimal K.

## Course Info

| Field | Details |
| --- | --- |
| Course | INT-396 Unsupervised Learning |
| University | Lovely Professional University |
| Faculty | Mrs. Sheveta |
| Group Members | Dammalapati Venkata Vamsi Kumar, Faizanur Rehman |
