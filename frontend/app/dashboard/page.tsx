"use client";

import { useMemo, useState } from "react";
import { AlertCircle, BarChart3, Download, Landmark } from "lucide-react";

import ClusterChart from "@/components/ClusterChart";
import Dendrogram from "@/components/Dendrogram";
import ElbowChart from "@/components/ElbowChart";
import RiskTable from "@/components/RiskTable";
import UploadPanel from "@/components/UploadPanel";
import type { ClusteringResult } from "@/lib/api";

type TabKey = "overview" | "visualizations" | "dendrogram";

const tabs: Array<{ key: TabKey; label: string }> = [
	{ key: "overview", label: "Overview" },
	{ key: "visualizations", label: "Visualizations" },
	{ key: "dendrogram", label: "Dendrogram" },
];

function renderPlaceholder() {
	return (
		<div className="flex min-h-[520px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-16 text-center">
			<div className="max-w-md">
				<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#01696f]/10 text-[#01696f]">
					<BarChart3 className="h-7 w-7" aria-hidden="true" />
				</div>
				<p className="mt-4 text-base font-medium text-slate-700 sm:text-lg">
					Upload a CSV or click "Use Sample Data" to see clustering results
				</p>
				<p className="mt-2 text-sm text-slate-500">
					Your charts, metrics, and risk cluster insights will appear here.
				</p>
			</div>
		</div>
	);
}

function renderLoadingSkeleton() {
	const shimmerStyle = {
		backgroundImage:
			"linear-gradient(90deg, #e2e8f0 0%, #f8fafc 50%, #e2e8f0 100%)",
		backgroundSize: "200% 100%",
		animation: "dashboard-shimmer 1.4s linear infinite",
	};

	return (
		<div className="min-h-[520px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
			<div className="space-y-4">
				<div className="h-10 rounded-xl" style={shimmerStyle} />
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
					<div className="h-40 rounded-xl" style={shimmerStyle} />
					<div className="h-40 rounded-xl" style={shimmerStyle} />
					<div className="h-40 rounded-xl" style={shimmerStyle} />
				</div>
				<div className="h-80 rounded-xl" style={shimmerStyle} />
			</div>
		</div>
	);
}

export default function DashboardPage() {
	const [result, setResult] = useState<ClusteringResult | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<TabKey>("overview");

	const encodingEntries = useMemo(() => {
		if (!result) {
			return [] as Array<[string, number]>;
		}
		return Object.entries(result.preprocessing.encoding_map);
	}, [result]);

	const handleResult = (nextResult: ClusteringResult) => {
		setResult(nextResult);
		setError(null);
		setActiveTab("overview");
	};

	const handleLoading = (isLoading: boolean) => {
		setLoading(isLoading);
		if (isLoading) {
			setError(null);
		}
	};

	const handleError = (message: string | null) => {
		setError(message);
	};

	const handleDownloadResults = () => {
		if (!result) {
			return;
		}

		const riskLabelByCluster = new Map<number, string>(
			result.profiles.clusters.map((profile) => [profile.id, profile.risk_label])
		);

		const header = ["Index", "PC1", "PC2", "KMeans_Cluster", "Risk_Label"];
		const rows = result.pca.points.map((point, index) => [
			index,
			point.x,
			point.y,
			point.cluster,
			riskLabelByCluster.get(point.cluster) ?? "Unknown",
		]);

		const escapeCSV = (value: string | number): string => {
			const normalized = String(value);
			if (/[",\n\r]/.test(normalized)) {
				return `"${normalized.replace(/"/g, '""')}"`;
			}
			return normalized;
		};

		const csvContent = [header, ...rows]
			.map((row) => row.map((value) => escapeCSV(value)).join(","))
			.join("\n");

		const blob = new Blob([csvContent], { type: "text/csv" });
		const downloadUrl = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = downloadUrl;
		link.download = "loan_risk_clusters.csv";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(downloadUrl);
	};

	return (
		<>
			<div className="min-h-screen bg-slate-50">
			<header className="border-b border-slate-200 bg-white">
				<div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
					<div className="flex items-center gap-2">
						<Landmark className="h-5 w-5 text-[#01696f]" aria-hidden="true" />
						<span className="text-base font-semibold text-slate-900 sm:text-lg">
							LoanRisk AI
						</span>
					</div>
					<p className="text-xs font-medium text-slate-600 sm:text-sm">
						INT-396 Unsupervised Learning
					</p>
				</div>
			</header>

			<main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
				<div className="flex flex-col gap-6 lg:grid lg:grid-cols-3">
					<aside className="space-y-4 lg:col-span-1">
						<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#01696f]/10 text-[#01696f]">
									<Landmark className="h-5 w-5" aria-hidden="true" />
								</div>
								<div>
									<p className="text-sm text-slate-500">Dashboard</p>
									<p className="text-lg font-semibold text-slate-900">LoanRisk AI</p>
								</div>
							</div>
						</div>

						<UploadPanel
							onResult={handleResult}
							onLoading={handleLoading}
							onError={handleError}
						/>

						{result && (
							<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
								<h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
									Preprocessing Summary
								</h2>

								<div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-3">
									<div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
										<p className="text-xs text-slate-500">Original Rows</p>
										<p className="mt-1 text-base font-semibold text-slate-900">
											{result.preprocessing.original_rows}
										</p>
									</div>
									<div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
										<p className="text-xs text-slate-500">Cleaned Rows</p>
										<p className="mt-1 text-base font-semibold text-slate-900">
											{result.preprocessing.cleaned_rows}
										</p>
									</div>
									<div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
										<p className="text-xs text-slate-500">Dropped Rows</p>
										<p className="mt-1 text-base font-semibold text-slate-900">
											{result.preprocessing.dropped_rows}
										</p>
									</div>
								</div>

								<div className="mt-4">
									<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
										Encoding Map
									</p>
									<div className="mt-2 flex flex-wrap gap-2">
										{encodingEntries.map(([label, value]) => (
											<span
												key={label}
												className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
											>
												{label}: {value}
											</span>
										))}
										{encodingEntries.length === 0 && (
											<span className="text-sm text-slate-500">No encoded values found.</span>
										)}
									</div>
								</div>
							</section>
						)}
					</aside>

					<section className="lg:col-span-2">
						{loading ? (
							renderLoadingSkeleton()
						) : error ? (
							<div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm sm:p-6">
								<div className="flex items-start gap-3">
									<AlertCircle className="mt-0.5 h-5 w-5 text-red-600" aria-hidden="true" />
									<div>
										<h2 className="text-base font-semibold text-red-700">
											Unable to process data
										</h2>
										<p className="mt-1 text-sm text-red-700">{error}</p>
										<button
											type="button"
											onClick={() => setError(null)}
											className="mt-3 inline-flex rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
										>
											Retry
										</button>
									</div>
								</div>
							</div>
						) : !result ? (
							renderPlaceholder()
						) : (
							<div className="space-y-4">
								{result && (
									<div className="flex justify-start sm:justify-end">
										<button
											type="button"
											onClick={handleDownloadResults}
											className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-[#01696f] hover:bg-[#01696f]/5 hover:text-[#01696f]"
										>
											<Download className="mr-2 h-4 w-4" aria-hidden="true" />
											Download Results as CSV
										</button>
									</div>
								)}

								<nav className="rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
									<div className="flex min-w-max items-center gap-5 overflow-x-auto whitespace-nowrap pr-2">
										{tabs.map((tab) => (
											<button
												key={tab.key}
												type="button"
												onClick={() => setActiveTab(tab.key)}
												className={[
													"relative shrink-0 whitespace-nowrap border-b-2 px-1 py-3 text-sm font-semibold transition",
													activeTab === tab.key
														? "border-[#01696f] text-[#01696f]"
														: "border-transparent text-slate-500 hover:text-slate-700",
												].join(" ")}
											>
												{tab.label}
											</button>
										))}
									</div>
								</nav>

								{activeTab === "overview" && (
									<RiskTable
										profiles={result.profiles.clusters}
										metrics={result.metrics}
									/>
								)}

								{activeTab === "visualizations" && (
									<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
										<ElbowChart data={result.elbow} />
										<ClusterChart
											data={result.pca}
											profiles={result.profiles.clusters.map((profile) => ({
												id: profile.id,
												risk_label: profile.risk_label,
											}))}
										/>
									</div>
								)}

								{activeTab === "dendrogram" && <Dendrogram data={result.dendrogram} />}
							</div>
						)}
					</section>
				</div>
			</main>
			</div>
			<style jsx global>{`
				@keyframes dashboard-shimmer {
					0% {
						background-position: 200% 0;
					}
					100% {
						background-position: -200% 0;
					}
				}
			`}</style>
		</>
	);
}
