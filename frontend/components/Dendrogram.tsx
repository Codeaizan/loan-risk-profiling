"use client";

import { useEffect, useRef } from "react";

interface DendrogramData {
	icoord: number[][];
	dcoord: number[][];
	color_list: string[];
	threshold: number;
}

interface DendrogramProps {
	data: DendrogramData | null;
}

const CANVAS_HEIGHT = 300;

const MATPLOTLIB_COLORS = [
	"#1f77b4",
	"#ff7f0e",
	"#2ca02c",
	"#d62728",
	"#9467bd",
	"#8c564b",
	"#e377c2",
	"#7f7f7f",
	"#bcbd22",
	"#17becf",
] as const;

function isValidData(data: DendrogramData | null): data is DendrogramData {
	return (
		data !== null &&
		data !== undefined &&
		Array.isArray(data.icoord) &&
		Array.isArray(data.dcoord) &&
		data.icoord.length > 0 &&
		data.dcoord.length > 0
	);
}

function resolveBranchColor(color: string | undefined): string {
	if (!color) {
		return "#0f172a";
	}

	if (color.startsWith("#") || color.startsWith("rgb") || color.startsWith("hsl")) {
		return color;
	}

	const match = /^C(\d+)$/.exec(color.trim());
	if (!match) {
		return color;
	}

	const index = Number(match[1]);
	return MATPLOTLIB_COLORS[index % MATPLOTLIB_COLORS.length];
}

export default function Dendrogram({ data }: DendrogramProps) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const wrapperRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		const wrapper = wrapperRef.current;

		if (!canvas || !wrapper || !isValidData(data)) {
			return;
		}

		const width = Math.max(wrapper.clientWidth, 320);
		const height = CANVAS_HEIGHT;
		const dpr = window.devicePixelRatio || 1;

		canvas.width = Math.floor(width * dpr);
		canvas.height = Math.floor(height * dpr);
		canvas.style.width = `${width}px`;
		canvas.style.height = `${height}px`;

		const context = canvas.getContext("2d");
		if (!context) {
			return;
		}

		context.setTransform(dpr, 0, 0, dpr, 0, 0);
		context.clearRect(0, 0, width, height);

		context.fillStyle = "#ffffff";
		context.fillRect(0, 0, width, height);

		const margin = {
			top: 48,
			right: 20,
			bottom: 46,
			left: 56,
		};

		const plotWidth = width - margin.left - margin.right;
		const plotHeight = height - margin.top - margin.bottom;

		const xValues = data.icoord.flat();
		const yValues = data.dcoord.flat();

		const xMin = Math.min(...xValues);
		const xMax = Math.max(...xValues);
		const yMin = 0;
		const yMax = Math.max(...yValues, data.threshold, 1e-9);

		const normalizeX = (value: number): number => {
			if (xMax === xMin) {
				return margin.left + plotWidth / 2;
			}
			return margin.left + ((value - xMin) / (xMax - xMin)) * plotWidth;
		};

		const normalizeY = (value: number): number => {
			if (yMax === yMin) {
				return margin.top + plotHeight;
			}
			const ratio = (value - yMin) / (yMax - yMin);
			return margin.top + plotHeight - ratio * plotHeight;
		};

		context.strokeStyle = "#cbd5e1";
		context.lineWidth = 1;
		context.beginPath();
		context.moveTo(margin.left, margin.top);
		context.lineTo(margin.left, margin.top + plotHeight);
		context.lineTo(margin.left + plotWidth, margin.top + plotHeight);
		context.stroke();

		for (let index = 0; index < data.icoord.length; index += 1) {
			const xCoords = data.icoord[index];
			const yCoords = data.dcoord[index];

			if (xCoords.length !== 4 || yCoords.length !== 4) {
				continue;
			}

			const [x0, _x1, _x2, x3] = xCoords;
			const [y0, y1, _y2, y3] = yCoords;

			context.strokeStyle = resolveBranchColor(data.color_list[index]);
			context.lineWidth = 1.5;
			context.beginPath();
			context.moveTo(normalizeX(x0), normalizeY(y0));
			context.lineTo(normalizeX(x0), normalizeY(y1));
			context.lineTo(normalizeX(x3), normalizeY(y1));
			context.lineTo(normalizeX(x3), normalizeY(y3));
			context.stroke();
		}

		const thresholdY = normalizeY(data.threshold);
		context.save();
		context.strokeStyle = "#dc2626";
		context.lineWidth = 1.5;
		context.setLineDash([6, 4]);
		context.beginPath();
		context.moveTo(margin.left, thresholdY);
		context.lineTo(margin.left + plotWidth, thresholdY);
		context.stroke();
		context.restore();

		context.fillStyle = "#dc2626";
		context.font = "12px sans-serif";
		context.fillText(
			"Cut threshold (K=3)",
			margin.left + 6,
			Math.max(margin.top + 12, thresholdY - 6)
		);

		context.fillStyle = "#0f172a";
		context.font = "600 16px sans-serif";
		context.fillText(
			"Hierarchical Clustering Dendrogram (Ward Linkage)",
			margin.left,
			24
		);

		context.fillStyle = "#475569";
		context.font = "12px sans-serif";
		context.textAlign = "center";
		context.fillText("Applicant Samples", margin.left + plotWidth / 2, height - 12);

		context.save();
		context.translate(16, margin.top + plotHeight / 2);
		context.rotate(-Math.PI / 2);
		context.textAlign = "center";
		context.fillText("Distance", 0, 0);
		context.restore();
	}, [data]);

	if (!isValidData(data)) {
		return (
			<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
				<h3 className="text-lg font-semibold text-slate-900">Dendrogram</h3>
				<p className="mt-3 text-sm text-slate-600">
					No dendrogram data available. Upload and analyze a dataset to render the
					hierarchical clustering tree.
				</p>
			</div>
		);
	}

	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
			<div ref={wrapperRef} className="w-full">
				<canvas ref={canvasRef} height={CANVAS_HEIGHT} className="block w-full" />
			</div>
		</div>
	);
}
