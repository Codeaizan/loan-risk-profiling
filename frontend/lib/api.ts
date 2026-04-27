const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  (process.env.NODE_ENV === "production"
    ? "https://loan-risk-profiling.onrender.com/"
    : "http://localhost:8000");

export interface PreprocessingReport {
  original_rows: number;
  cleaned_rows: number;
  dropped_rows: number;
  encoding_map: Record<string, number>;
  features_scaled: string[];
}

export interface ElbowResult {
  k_values: number[];
  wcss: number[];
  optimal_k: number;
}

export interface DendrogramData {
  icoord: number[][];
  dcoord: number[][];
  color_list: string[];
  threshold: number;
}

export interface ClusteringMetrics {
  silhouette_score: number;
  davies_bouldin_index: number;
  n_clusters: number;
  cluster_sizes: Record<string, number>;
}

export interface PCAPoint {
  x: number;
  y: number;
  cluster: number;
}

export interface PCAProjection {
  points: PCAPoint[];
  explained_variance: [number, number];
}

export interface ClusterProfile {
  id: number;
  risk_label: string;
  size: number;
  avg_income: number;
  avg_loan_amount: number;
  avg_credit_score: number;
  avg_age: number;
  avg_existing_loans: number;
}

export interface ClusterProfilesResponse {
  clusters: ClusterProfile[];
}

export interface ClusteringResult {
  preprocessing: PreprocessingReport;
  elbow: ElbowResult;
  kmeans_labels: number[];
  hierarchical_labels: number[];
  dendrogram: DendrogramData;
  metrics: ClusteringMetrics;
  pca: PCAProjection;
  profiles: ClusterProfilesResponse;
}

export interface SampleDataRow {
  [key: string]: string | number;
}

export interface SampleDataResponse {
  data: SampleDataRow[];
  columns: string[];
}

interface APIErrorPayload {
  error?: string;
  detail?: string;
  message?: string;
}

async function parseErrorMessage(response: Response): Promise<string> {
  const fallback = `Request failed with status ${response.status}`;
  const raw = await response.text();

  if (!raw) {
    return fallback;
  }

  try {
    const payload = JSON.parse(raw) as APIErrorPayload;
    return payload.error ?? payload.detail ?? payload.message ?? raw;
  } catch {
    return raw;
  }
}

async function requestJSON<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, init);

  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response);
    const error = new Error(errorMessage) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return (await response.json()) as T;
}

export async function uploadCSV(file: File, k = 3): Promise<ClusteringResult> {
  const formData = new FormData();
  formData.append("file", file);

  const query = new URLSearchParams({ k: String(k) });

  return requestJSON<ClusteringResult>(`/api/upload?${query.toString()}`, {
    method: "POST",
    body: formData,
  });
}

export async function fetchSampleData(): Promise<SampleDataResponse> {
  return requestJSON<SampleDataResponse>("/api/sample-data", {
    method: "GET",
  });
}

export async function checkHealth(): Promise<{ status: string; version: string }> {
  return requestJSON<{ status: string; version: string }>("/api/health", {
    method: "GET",
  });
}