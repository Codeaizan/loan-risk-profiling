"use client";

import { useEffect, useState } from "react";

import {
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Scatter,
	ScatterChart,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

interface PCAPoint {
	x: number;
	y: number;
	cluster: number;
}

interface ClusterProfileSummary {
	id: number;
	risk_label: string;
}

interface ClusterChartData {
	points: Array<PCAPoint>;
	explained_variance: number[];
}

interface ClusterChartProps {
	data: ClusterChartData;
	profiles: Array<ClusterProfileSummary>;
}

type RiskLabel = "Low Risk" | "Medium Risk" | "High Risk";

const RISK_COLORS: Record<RiskLabel, string> = {
	"Low Risk": "#16A34A",
	"Medium Risk": "#D97706",
	"High Risk": "#DC2626",
};

const DEFAULT_COLOR = "#0f172a";

function normalizeRiskLabel(riskLabel: string): RiskLabel | null {
	if (riskLabel === "Low Risk") {
		return "Low Risk";
	}
	if (riskLabel === "Medium Risk") {
		return "Medium Risk";
	}
	if (riskLabel === "High Risk") {
		return "High Risk";
	}
	return null;
}

export default function ClusterChart({ data, profiles }: ClusterChartProps) {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const updateIsMobile = () => {
			setIsMobile(window.innerWidth < 640);
		};

		updateIsMobile();
		window.addEventListener("resize", updateIsMobile);
		return () => window.removeEventListener("resize", updateIsMobile);
	}, []);

	const chartHeight = isMobile ? 220 : 350;

	const profileById = new Map<number, ClusterProfileSummary>(
		profiles.map((profile) => [profile.id, profile])
	);

	const groupedByRisk = new Map<string, PCAPoint[]>();
	for (const point of data.points) {
		const profile = profileById.get(point.cluster);
		const riskLabel = profile?.risk_label ?? `Cluster ${point.cluster}`;

		if (!groupedByRisk.has(riskLabel)) {
			groupedByRisk.set(riskLabel, []);
		}
		groupedByRisk.get(riskLabel)?.push(point);
	}

	const orderedRiskLabels = ["Low Risk", "Medium Risk", "High Risk"];
	const orderedSeries = [
		...orderedRiskLabels.filter((label) => groupedByRisk.has(label)),
		...Array.from(groupedByRisk.keys()).filter(
			(label) => !orderedRiskLabels.includes(label)
		),
	];

	const pc1Variance = (Number(data.explained_variance?.[0] ?? 0) * 100).toFixed(2);
	const pc2Variance = (Number(data.explained_variance?.[1] ?? 0) * 100).toFixed(2);

	return (
		<div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm sm:p-6">
			<h3 className="text-lg font-semibold text-slate-900">
				K-Means Cluster Visualization (PCA Projection)
			</h3>

			<div className="mt-4 w-full" style={{ height: chartHeight }}>
				<ResponsiveContainer width="100%" height="100%">
					<ScatterChart margin={{ top: 16, right: 20, left: 6, bottom: 24 }}>
						<CartesianGrid stroke="#dbe4ee" strokeDasharray="3 3" />

						<XAxis
							type="number"
							dataKey="x"
							tickLine={false}
							axisLine={{ stroke: "#cbd5e1" }}
							name="PC1"
							label={{
								value: `Principal Component 1 (${pc1Variance}%)`,
								position: "insideBottom",
								offset: -10,
								fill: "#475569",
							}}
						/>

						<YAxis
							type="number"
							dataKey="y"
							tickLine={false}
							axisLine={{ stroke: "#cbd5e1" }}
							name="PC2"
							label={{
								value: `Principal Component 2 (${pc2Variance}%)`,
								angle: -90,
								position: "insideLeft",
								fill: "#475569",
							}}
						/>

						<Tooltip
							cursor={{ strokeDasharray: "3 3" }}
							contentStyle={{
								borderRadius: "0.5rem",
								border: "1px solid #dbe4ee",
								backgroundColor: "#ffffff",
							}}
							formatter={(value, _name, payload) => {
								if (!payload?.payload) {
									return [String(value), "Value"];
								}

								const point = payload.payload as PCAPoint;
								return [
									`Cluster: ${point.cluster} | PC1: ${point.x.toFixed(2)} | PC2: ${point.y.toFixed(2)}`,
									"Point",
								];
							}}
						/>

						<Legend
							verticalAlign="top"
							height={36}
							iconType="circle"
							wrapperStyle={{ color: "#334155", fontSize: "13px" }}
						/>

						{orderedSeries.map((riskLabel) => {
							const normalized = normalizeRiskLabel(riskLabel);
							const color = normalized ? RISK_COLORS[normalized] : DEFAULT_COLOR;

							return (
								<Scatter
									key={riskLabel}
									name={riskLabel}
									data={groupedByRisk.get(riskLabel) ?? []}
									fill={color}
								/>
							);
						})}
					</ScatterChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
