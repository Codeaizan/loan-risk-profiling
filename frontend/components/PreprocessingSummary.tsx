import { CheckCircle2 } from "lucide-react";

interface PreprocessingSummaryData {
	original_rows: number;
	cleaned_rows: number;
	dropped_rows: number;
	encoding_map: Record<string, number>;
	features_scaled: string[];
}

interface PreprocessingSummaryProps {
	data: PreprocessingSummaryData;
}

export default function PreprocessingSummary({ data }: PreprocessingSummaryProps) {
	const encodingEntries = Object.entries(data.encoding_map);

	return (
		<section className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
			<div className="flex items-center gap-2">
				<CheckCircle2 className="h-4 w-4 text-[#01696f]" aria-hidden="true" />
				<h3 className="text-xs font-semibold uppercase tracking-wide text-slate-800">
					Data Preprocessing Summary
				</h3>
			</div>

			<div className="flex flex-wrap gap-2 text-xs">
				<span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
					{data.original_rows} original
				</span>
				<span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
					{data.cleaned_rows} cleaned
				</span>
				<span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
					{data.dropped_rows} dropped
				</span>
			</div>

			<div>
				<p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
					Encoding Applied
				</p>
				<div className="mt-1 flex flex-wrap gap-1.5">
					{encodingEntries.length > 0 ? (
						encodingEntries.map(([label, value]) => (
							<span
								key={label}
								className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-700"
							>
								{label} -&gt; {value}
							</span>
						))
					) : (
						<p className="text-xs text-slate-500">No categorical encoding values</p>
					)}
				</div>
			</div>

			<div>
				<p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
					Features Scaled
				</p>
				<p className="mt-1 text-xs leading-5 text-slate-700">
					{data.features_scaled.length > 0
						? data.features_scaled.join(", ")
						: "No numeric features were scaled."}
				</p>
			</div>

			<div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
				<span className="mr-1">✓</span>
				Data Ready for Clustering
			</div>
		</section>
	);
}
