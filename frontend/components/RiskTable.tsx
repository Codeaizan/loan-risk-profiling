interface RiskProfile {
	id: number;
	risk_label: string;
	size: number;
	avg_income: number;
	avg_loan_amount: number;
	avg_credit_score: number;
	avg_age: number;
	avg_existing_loans: number;
}

interface EvaluationMetrics {
	silhouette_score: number;
	davies_bouldin_index: number;
	n_clusters: number;
	cluster_sizes: Record<string, number>;
}

interface RiskTableProps {
	profiles: Array<RiskProfile>;
	metrics: EvaluationMetrics;
}

type RiskLabel = "Low Risk" | "Medium Risk" | "High Risk";

const riskStyles: Record<
	RiskLabel,
	{
		badge: string;
		border: string;
		recommendation: string;
	}
> = {
	"Low Risk": {
		badge: "bg-green-100 text-green-700 border border-green-200",
		border: "border-l-green-500",
		recommendation: "✓ Approve with standard terms",
	},
	"Medium Risk": {
		badge: "bg-amber-100 text-amber-700 border border-amber-200",
		border: "border-l-amber-500",
		recommendation: "⚠ Additional verification needed",
	},
	"High Risk": {
		badge: "bg-red-100 text-red-700 border border-red-200",
		border: "border-l-red-500",
		recommendation: "✗ Reject or require collateral",
	},
};

const defaultCardBorder = "border-l-slate-400";

function normalizeRiskLabel(value: string): RiskLabel | null {
	if (value === "Low Risk") {
		return "Low Risk";
	}
	if (value === "Medium Risk") {
		return "Medium Risk";
	}
	if (value === "High Risk") {
		return "High Risk";
	}
	return null;
}

function formatCurrency(value: number): string {
	const formatted = new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 0,
	}).format(value);

	return formatted;
}

export default function RiskTable({ profiles, metrics }: RiskTableProps) {
	const sortedProfiles = [...profiles].sort((a, b) => a.id - b.id);

	return (
		<div className="space-y-6">
			<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
				<div className="mb-5 flex items-center justify-between gap-4">
					<h3 className="text-lg font-semibold text-slate-900">Risk Cluster Cards</h3>
					<p className="text-sm text-slate-500">Cluster-level profile summary</p>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-1 lg:grid-cols-3">
					{sortedProfiles.map((profile) => {
						const riskLabel = normalizeRiskLabel(profile.risk_label);
						const style = riskLabel ? riskStyles[riskLabel] : null;

						return (
							<article
								key={profile.id}
								className={`rounded-xl border border-slate-200 border-l-4 bg-slate-50/50 p-4 ${style?.border ?? defaultCardBorder}`}
							>
								<div className="flex items-center justify-between gap-3">
									<span
										className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style?.badge ?? "bg-slate-100 text-slate-700 border border-slate-200"}`}
									>
										{profile.risk_label}
									</span>
									<span className="text-xs font-medium text-slate-500">Cluster {profile.id}</span>
								</div>

								<div className="mt-4 space-y-2 text-sm text-slate-700">
									<p className="font-medium text-slate-800">{profile.size} applicants</p>
									<p>
										<span className="text-slate-500">Avg Income: </span>
										<span className="font-medium">{formatCurrency(profile.avg_income)}</span>
									</p>
									<p>
										<span className="text-slate-500">Avg Loan Amount: </span>
										<span className="font-medium">{formatCurrency(profile.avg_loan_amount)}</span>
									</p>
									<p>
										<span className="text-slate-500">Avg Credit Score: </span>
										<span className="font-medium">{profile.avg_credit_score.toFixed(2)}</span>
									</p>
									<p>
										<span className="text-slate-500">Avg Age: </span>
										<span className="font-medium">{profile.avg_age.toFixed(2)}</span>
									</p>
									<p>
										<span className="text-slate-500">Avg Existing Loans: </span>
										<span className="font-medium">{profile.avg_existing_loans.toFixed(2)}</span>
									</p>
								</div>

								<div className="mt-4 border-t border-slate-200 pt-3 text-sm font-medium text-slate-800">
									{style?.recommendation ?? "Review cluster profile before decision"}
								</div>
							</article>
						);
					})}
				</div>
			</section>

			<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
				<h3 className="text-lg font-semibold text-slate-900">Evaluation Metrics</h3>

				<div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
					<div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
						<p className="text-3xl font-bold text-slate-900">
							{metrics.silhouette_score.toFixed(4)}
						</p>
						<p className="mt-1 text-sm font-medium text-slate-700">Silhouette Score</p>
						<p className="text-xs text-slate-500">Higher is better</p>
					</div>

					<div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
						<p className="text-3xl font-bold text-slate-900">
							{metrics.davies_bouldin_index.toFixed(4)}
						</p>
						<p className="mt-1 text-sm font-medium text-slate-700">
							Davies-Bouldin Index
						</p>
						<p className="text-xs text-slate-500">Lower is better</p>
					</div>

					<div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
						<p className="text-3xl font-bold text-slate-900">{metrics.n_clusters}</p>
						<p className="mt-1 text-sm font-medium text-slate-700">Total Clusters</p>
						<p className="text-xs text-slate-500">K-Means groups generated</p>
					</div>
				</div>
			</section>
		</div>
	);
}
