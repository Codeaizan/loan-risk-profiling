"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { AlertCircle, FileText, Loader2, Upload, X } from "lucide-react";

import {
	ClusteringResult,
	SampleDataResponse,
	fetchSampleData,
	uploadCSV,
} from "@/lib/api";

interface UploadPanelProps {
	onResult: (result: ClusteringResult) => void;
	onLoading: (loading: boolean) => void;
	onError: (error: string | null) => void;
}

const REQUIRED_COLUMNS = [
	"Age",
	"Income",
	"LoanAmount",
	"CreditScore",
	"ExistingLoans",
	"EmploymentStatus",
] as const;

const MIN_K = 2;
const MAX_K = 8;

const MISSING_COLUMNS_ERROR =
	"Missing required columns. Your CSV must include: Age, Income, LoanAmount, CreditScore, ExistingLoans, EmploymentStatus";
const NETWORK_ERROR =
	"Cannot connect to the analysis server. Make sure the backend is running on port 8000.";

type APIError = Error & { status?: number };

function formatFileSize(bytes: number): string {
	if (bytes < 1024) {
		return `${bytes} B`;
	}

	const units = ["KB", "MB", "GB"];
	let value = bytes / 1024;
	let unitIndex = 0;

	while (value >= 1024 && unitIndex < units.length - 1) {
		value /= 1024;
		unitIndex += 1;
	}

	return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function parseCSVLine(line: string): string[] {
	const cells: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let index = 0; index < line.length; index += 1) {
		const char = line[index];
		const nextChar = line[index + 1];

		if (char === '"') {
			if (inQuotes && nextChar === '"') {
				current += '"';
				index += 1;
			} else {
				inQuotes = !inQuotes;
			}
			continue;
		}

		if (char === "," && !inQuotes) {
			cells.push(current.trim());
			current = "";
			continue;
		}

		current += char;
	}

	cells.push(current.trim());
	return cells;
}

function getFirstNonEmptyLine(text: string): string | null {
	const lines = text.split(/\r?\n/);
	for (const line of lines) {
		if (line.trim().length > 0) {
			return line;
		}
	}
	return null;
}

async function validateCSVFile(file: File): Promise<void> {
	if (!file.name.toLowerCase().endsWith(".csv")) {
		throw new Error("Only .csv files are accepted.");
	}

	const csvText = await file.text();
	const headerLine = getFirstNonEmptyLine(csvText);
	if (!headerLine) {
		throw new Error("CSV file is empty.");
	}

	const headers = parseCSVLine(headerLine)
		.map((header) => header.replace(/^\uFEFF/, "").trim())
		.filter((header) => header.length > 0);

	const missingColumns = REQUIRED_COLUMNS.filter(
		(column) => !headers.includes(column)
	);

	if (missingColumns.length > 0) {
		throw new Error(`Missing required columns: ${missingColumns.join(", ")}`);
	}
}

function escapeCSVValue(value: string | number | undefined): string {
	const str = value === undefined ? "" : String(value);
	if (/[",\n\r]/.test(str)) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

function sampleDataToCSV(sampleData: SampleDataResponse): string {
	const { columns, data } = sampleData;
	if (columns.length === 0) {
		throw new Error("Sample data response is missing columns.");
	}

	const headerRow = columns.join(",");
	const rows = data.map((row) =>
		columns.map((column) => escapeCSVValue(row[column])).join(",")
	);

	return [headerRow, ...rows].join("\n");
}

function getErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message) {
		return error.message;
	}
	return "Something went wrong while processing the file.";
}

function mapUploadError(error: unknown): string {
	if (error instanceof TypeError) {
		return NETWORK_ERROR;
	}

	if (error instanceof Error) {
		const apiError = error as APIError;
		const message = error.message || "";

		if (apiError.status === 422 || /\b422\b/.test(message)) {
			return MISSING_COLUMNS_ERROR;
		}

		if (
			/apiError.status === 0/.test(message) ||
			/failed to fetch|networkerror|load failed|fetch failed|network request failed/i.test(
				message
			)
		) {
			return NETWORK_ERROR;
		}

		if (/missing required columns/i.test(message)) {
			return MISSING_COLUMNS_ERROR;
		}
	}

	return getErrorMessage(error);
}

export default function UploadPanel({
	onResult,
	onLoading,
	onError,
}: UploadPanelProps) {
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [kClusters, setKClusters] = useState<number>(3);
	const [isDragging, setIsDragging] = useState(false);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const syncError = (message: string | null) => {
		setErrorMessage(message);
		onError(message);
	};

	const handleFileValidation = async (file: File): Promise<void> => {
		try {
			await validateCSVFile(file);
			setSelectedFile(file);
			syncError(null);
		} catch (error) {
			setSelectedFile(null);
			syncError(getErrorMessage(error));
		}
	};

	const handleFileInputChange = async (
		event: ChangeEvent<HTMLInputElement>
	): Promise<void> => {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}

		await handleFileValidation(file);
		event.target.value = "";
	};

	const handleDragOver = (event: DragEvent<HTMLButtonElement>): void => {
		event.preventDefault();
		if (!isAnalyzing) {
			setIsDragging(true);
		}
	};

	const handleDragLeave = (event: DragEvent<HTMLButtonElement>): void => {
		event.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = async (event: DragEvent<HTMLButtonElement>): Promise<void> => {
		event.preventDefault();
		setIsDragging(false);

		if (isAnalyzing) {
			return;
		}

		const file = event.dataTransfer.files?.[0];
		if (!file) {
			return;
		}

		await handleFileValidation(file);
	};

	const handleAnalyze = async (): Promise<void> => {
		if (!selectedFile) {
			syncError("Please select a CSV file before analyzing.");
			return;
		}

		if (kClusters < MIN_K || kClusters > MAX_K) {
			syncError(`K must be between ${MIN_K} and ${MAX_K}.`);
			return;
		}

		setIsAnalyzing(true);
		onLoading(true);
		syncError(null);

		try {
			const result = await uploadCSV(selectedFile, kClusters);
			onResult(result);
		} catch (error) {
			syncError(mapUploadError(error));
		} finally {
			setIsAnalyzing(false);
			onLoading(false);
		}
	};

	const handleUseSampleData = async (): Promise<void> => {
		setIsAnalyzing(true);
		onLoading(true);
		syncError(null);

		try {
			const sampleData = await fetchSampleData();
			const csvContent = sampleDataToCSV(sampleData);
			const sampleFile = new File([csvContent], "sample-loan-data.csv", {
				type: "text/csv",
			});

			await validateCSVFile(sampleFile);
			setSelectedFile(sampleFile);

			const result = await uploadCSV(sampleFile, kClusters);
			onResult(result);
		} catch (error) {
			syncError(mapUploadError(error));
		} finally {
			setIsAnalyzing(false);
			onLoading(false);
		}
	};

	return (
		<section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
			<div>
				<label className="block text-sm font-semibold text-slate-800">CSV Upload</label>
				<input
					ref={fileInputRef}
					type="file"
					accept=".csv,text/csv"
					onChange={(event) => {
						void handleFileInputChange(event);
					}}
					className="hidden"
					disabled={isAnalyzing}
				/>

				<button
					type="button"
					onClick={() => fileInputRef.current?.click()}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={(event) => {
						void handleDrop(event);
					}}
					disabled={isAnalyzing}
					className={[
						"mt-2 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-10 text-center transition",
						isDragging
							? "border-[#01696f] bg-[#01696f]/5"
							: "border-slate-300 hover:border-[#01696f]/70 hover:bg-slate-50",
						isAnalyzing ? "cursor-not-allowed opacity-70" : "cursor-pointer",
					].join(" ")}
				>
					<Upload className="h-9 w-9 text-[#01696f]" aria-hidden="true" />
					<p className="mt-3 text-sm font-medium text-slate-800 sm:text-base">
						Drag &amp; drop your CSV or click to browse
					</p>
					<p className="mt-1 text-xs text-slate-500">Only .csv files are accepted</p>
				</button>

				{selectedFile && (
					<div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
						<FileText className="h-4 w-4 text-[#01696f]" aria-hidden="true" />
						<span className="font-medium">{selectedFile.name}</span>
						<span className="text-slate-500">({formatFileSize(selectedFile.size)})</span>
					</div>
				)}

				{errorMessage && (
					<div className="mt-3 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
						<div className="flex items-start gap-2">
							<AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
							<span>{errorMessage}</span>
						</div>
						<button
							type="button"
							onClick={() => syncError(null)}
							className="rounded p-0.5 text-red-600 transition hover:bg-red-100 hover:text-red-700"
							aria-label="Dismiss error"
						>
							<X className="h-4 w-4" aria-hidden="true" />
						</button>
					</div>
				)}
			</div>

			<div>
				<label htmlFor="k-clusters" className="block text-sm font-semibold text-slate-800">
					K Clusters
				</label>
				<input
					id="k-clusters"
					type="number"
					min={MIN_K}
					max={MAX_K}
					value={kClusters}
					onChange={(event) => {
						setKClusters(Number(event.target.value));
					}}
					disabled={isAnalyzing}
					className="mt-2 w-full max-w-[180px] rounded-lg border border-slate-300 px-3 py-2 text-slate-800 outline-none ring-[#01696f]/30 transition focus:border-[#01696f] focus:ring"
				/>
			</div>

			<div className="flex flex-col gap-3 sm:flex-row">
				<button
					type="button"
					onClick={() => {
						void handleAnalyze();
					}}
					disabled={isAnalyzing}
					className="inline-flex items-center justify-center rounded-lg bg-[#01696f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#01575c] disabled:cursor-not-allowed disabled:opacity-70"
				>
					{isAnalyzing ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
							Analyzing...
						</>
					) : (
						"Upload & Analyze"
					)}
				</button>

				<button
					type="button"
					onClick={() => {
						void handleUseSampleData();
					}}
					disabled={isAnalyzing}
					className="inline-flex items-center justify-center rounded-lg border border-[#01696f] px-5 py-2.5 text-sm font-semibold text-[#01696f] transition hover:bg-[#01696f]/5 disabled:cursor-not-allowed disabled:opacity-70"
				>
					Use Sample Data
				</button>
			</div>

			{isAnalyzing && (
				<div className="inline-flex items-center gap-2 rounded-lg bg-[#01696f]/10 px-3 py-2 text-sm font-medium text-[#01696f]">
					<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
					<span>Analyzing...</span>
				</div>
			)}

			<details className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
				<summary className="cursor-pointer text-sm font-semibold text-slate-800">
					CSV Format Guide
				</summary>
				<div className="mt-3 space-y-2 text-sm text-slate-600">
					<p>Required column headers:</p>
					<div className="rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-700 sm:text-sm">
						{REQUIRED_COLUMNS.join(", ")}
					</div>
				</div>
			</details>
		</section>
	);
}
