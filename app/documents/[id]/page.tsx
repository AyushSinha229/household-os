"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ArrowLeft, FileText, CheckCircle2, RotateCw } from "lucide-react";
import { formatIndianDate } from "@/lib/utils";

interface DocumentDetail {
  id: string;
  title: string;
  originalName: string;
  docType: string;
  status: string;
  confidenceScore: number;
  extractedJson: string;
  rawText: string;
  createdAt: string;
}

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/documents")
      .then((res) => res.json())
      .then((data) => {
        const found = data.documents?.find((d: DocumentDetail) => d.id === resolvedParams.id);
        setDoc(found || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <AppShell>
        <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RotateCw className="w-4 h-4 animate-spin text-teal-600" />
          <span>Loading document records...</span>
        </div>
      </AppShell>
    );
  }

  if (!doc) {
    return (
      <AppShell>
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <p className="text-slate-600 text-sm">Document not found.</p>
          <Link href="/documents" className="mt-3 inline-block text-xs text-teal-600 font-semibold">
            &larr; Back to Documents
          </Link>
        </div>
      </AppShell>
    );
  }

  const parsed = doc.extractedJson ? JSON.parse(doc.extractedJson) : null;

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/documents"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Documents Archive</span>
        </Link>

        {/* Document Header */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 uppercase">
              <FileText className="w-4 h-4" />
              <span>{doc.docType}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{doc.title}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Original File: {doc.originalName} • Ingested {formatIndianDate(doc.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                doc.status === "CONFIRMED"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              Status: {doc.status}
            </span>
          </div>
        </div>

        {/* Extracted Structured JSON */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-3">
            Structured Extraction Payload (Validated via Zod)
          </h2>
          <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs overflow-x-auto font-mono">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        </div>
      </div>
    </AppShell>
  );
}
