import Link from "next/link";
import {
  BarChart3,
  Database,
  Landmark,
  Layers3,
  Sparkles,
  Upload,
} from "lucide-react";

const steps = [
  {
    title: "Upload Data",
    description: "Upload your loan applicant CSV or use our sample dataset",
    icon: Upload,
  },
  {
    title: "Preprocess",
    description: "Automatic encoding, scaling, and cleaning",
    icon: Sparkles,
  },
  {
    title: "Cluster",
    description: "K-Means and Hierarchical Clustering applied",
    icon: Layers3,
  },
  {
    title: "Interpret",
    description: "Clusters labeled as Low, Medium, High Risk",
    icon: BarChart3,
  },
] as const;

const techStack = ["Python", "FastAPI", "scikit-learn", "Next.js", "Recharts"] as const;

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#01696f]/10 text-[#01696f]">
              <Landmark className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight sm:text-xl">LoanRisk AI</p>
              <p className="text-xs text-slate-600 sm:text-sm">
                Unsupervised Clustering for Applicant Risk Segmentation
              </p>
            </div>
          </div>

          <nav>
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#01696f] hover:text-[#01696f]"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto w-full max-w-6xl px-4 pb-14 pt-14 sm:px-6 lg:px-8 lg:pb-20 lg:pt-20">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-6xl">
              Discover Hidden Risk Patterns in Loan Data
            </h1>
            <p className="mt-6 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              This tool uses K-Means and Hierarchical Clustering to segment loan
              applicants into Low, Medium, and High risk groups without labeled data.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-md bg-[#01696f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#01575c]"
              >
                Try with Sample Data
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-md border border-[#01696f] px-6 py-3 text-sm font-semibold text-[#01696f] transition hover:bg-[#01696f]/5"
              >
                Upload Your CSV
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-50/40 py-14 sm:py-16">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              How It Works
            </h2>

            <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-4">
              {steps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <article
                    key={step.title}
                    className="rounded-xl border border-slate-200 bg-white p-5"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#01696f]">
                        Step {index + 1}
                      </span>
                      <Icon className="h-5 w-5 text-[#01696f]" aria-hidden="true" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-14">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
              <Database className="h-4 w-4 text-[#01696f]" aria-hidden="true" />
              <span>Tech Stack</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 text-center text-sm text-slate-600 sm:px-6 lg:px-8">
          INT-396 Unsupervised Learning Project · Lovely Professional University
        </div>
      </footer>
    </div>
  );
}
