"use client";

import { useEffect, useState } from "react";

import {
	Area,
	CartesianGrid,
	Line,
	LineChart,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

interface ElbowChartData {
	k_values: number[];
	wcss: number[];
	optimal_k: number;
}

interface ElbowChartProps {
	data: ElbowChartData | null;
}

export default function ElbowChart({ data }: ElbowChartProps) {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const updateIsMobile = () => {
			setIsMobile(window.innerWidth < 640);
		};

		updateIsMobile();
		window.addEventListener("resize", updateIsMobile);
		return () => window.removeEventListener("resize", updateIsMobile);
	}, []);

	const chartHeight = isMobile ? 220 : 300;

	if (!data || data.k_values.length === 0 || data.wcss.length === 0) {
		return (
			<div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm sm:p-6">
				<h3 className="text-lg font-semibold text-slate-900">
					Elbow Method — Selecting Optimal K
				</h3>
				<div
					className="mt-4 flex w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm font-medium text-slate-500"
					style={{ height: chartHeight }}
				>
					No elbow data available
				</div>
			</div>
		);
	}

	const chartData = data.k_values.map((kValue, index) => ({
		k: kValue,
		wcss: Number(data.wcss[index] ?? 0),
	}));

	return (
		<div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm sm:p-6">
			<h3 className="text-lg font-semibold text-slate-900">
				Elbow Method — Selecting Optimal K
			</h3>

			<div className="mt-4 w-full" style={{ height: chartHeight }}>
				<ResponsiveContainer width="100%" height="100%">
					<LineChart
						data={chartData}
						margin={{ top: 12, right: 16, left: 8, bottom: 24 }}
					>
						<defs>
							<linearGradient id="elbow-area-fill" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="#01696f" stopOpacity={0.2} />
								<stop offset="100%" stopColor="#01696f" stopOpacity={0.02} />
							</linearGradient>
						</defs>

						<CartesianGrid stroke="#dbe4ee" strokeDasharray="3 3" />

						<XAxis
							dataKey="k"
							type="number"
							domain={["dataMin", "dataMax"]}
							allowDecimals={false}
							tickLine={false}
							axisLine={{ stroke: "#cbd5e1" }}
							label={{
								value: "Number of Clusters",
								position: "insideBottom",
								offset: -10,
								fill: "#475569",
							}}
						/>

						<YAxis
							dataKey="wcss"
							tickLine={false}
							axisLine={{ stroke: "#cbd5e1" }}
							label={{ value: "WCSS", angle: -90, position: "insideLeft", fill: "#475569" }}
						/>

						<Tooltip
							labelFormatter={(value) => `K: ${String(value)}`}
							formatter={(value) => [Number(value).toFixed(2), "WCSS"]}
							contentStyle={{
								borderRadius: "0.5rem",
								border: "1px solid #dbe4ee",
								backgroundColor: "#ffffff",
							}}
						/>

						<Area
							type="monotone"
							dataKey="wcss"
							stroke="none"
							fill="url(#elbow-area-fill)"
						/>

						<Line
							type="monotone"
							dataKey="wcss"
							stroke="#01696f"
							strokeWidth={3}
							dot={{ r: 4, fill: "#01696f", stroke: "#ffffff", strokeWidth: 1.5 }}
							activeDot={{ r: 6, fill: "#01696f", stroke: "#ffffff", strokeWidth: 2 }}
						/>

						<ReferenceLine
							x={data.optimal_k}
							stroke="#dc2626"
							strokeDasharray="6 4"
							label={{
								value: `Optimal K=${data.optimal_k}`,
								position: "top",
								fill: "#dc2626",
								fontSize: 12,
							}}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
