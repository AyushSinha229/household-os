"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Tv,
  Receipt,
  RotateCw,
  Sparkles,
  ArrowRight,
  ExternalLink,
  X,
  FileUp,
} from "lucide-react";
import { formatINR, formatIndianDate } from "@/lib/utils";

interface DocumentItem {
  id: string;
  title: string;
  originalName: string;
  fileType: string;
  status: string;
  docType: string;
  confidenceScore: number;
  extractedJson: string;
  createdAt: string;
  extractions: Array<{
    id: string;
    extractedType: string;
    vendorOrBrand: string;
    totalAmount: number;
    downstreamApplied: boolean;
  }>;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [reviewDoc, setReviewDoc] = useState<{
    documentId: string;
    docType: string;
    extractedData: Record<string, unknown>;
    confidence: number;
    summary: string;
  } | null>(null);

  const [confirming, setConfirming] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Handle uploading real file or running sample Indian document
  const handleUploadSample = async (sampleType: string) => {
    setProcessing(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleType }),
      });

      const data = await res.json();
      if (res.ok) {
        setReviewDoc({
          documentId: data.document.id,
          docType: data.extraction.extractedType,
          extractedData: data.extractedData,
          confidence: data.confidence,
          summary: data.summary,
        });
        await fetchDocuments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type || "application/pdf",
            base64Data,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setReviewDoc({
            documentId: data.document.id,
            docType: data.extraction.extractedType,
            extractedData: data.extractedData,
            confidence: data.confidence,
            summary: data.summary,
          });
          await fetchDocuments();
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  // User Confirms Extraction -> Applies Downstream Database Changes!
  const handleConfirmExtraction = async () => {
    if (!reviewDoc) return;
    setConfirming(true);
    try {
      const res = await fetch("/api/documents/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: reviewDoc.documentId,
          docType: reviewDoc.docType,
          confirmedData: reviewDoc.extractedData,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessNotice(
          data.message || "Document verified and household state updated!"
        );
        setReviewDoc(null);
        await fetchDocuments();
        setTimeout(() => setSuccessNotice(null), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multimodal AI Document Pipeline</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              Household Document Intelligence
            </h1>
            <p className="text-sm text-slate-500">
              Upload invoices, receipts, and utility bills. Structured extraction automatically updates your household inventory, appliances, and expenses.
            </p>
          </div>
        </div>

        {/* Success Notice */}
        {successNotice && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-medium flex items-center gap-2 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="font-bold">Downstream Household State Updated!</div>
              <div>{successNotice}</div>
            </div>
          </div>
        )}

        {/* Upload & Demo Sample Invoices Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Custom File Upload Box */}
          <div className="p-6 bg-white rounded-xl border border-dashed border-slate-300 hover:border-teal-500 flex flex-col items-center justify-center text-center shadow-xs transition-colors group">
            <div className="w-12 h-12 rounded-full bg-teal-50 group-hover:bg-teal-100 text-teal-600 flex items-center justify-center mb-3 transition-colors">
              <FileUp className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Upload Invoice / Receipt</h3>
            <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, PDF</p>
            <label className="mt-3 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Choose File</span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileUpload}
                className="hidden"
                disabled={processing}
              />
            </label>
          </div>

          {/* Sample 1: Voltas Inverter AC Tax Invoice */}
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-teal-300 transition-colors">
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-teal-700 mb-1">
                <span>Demo Sample Invoice</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">Appliance</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                Voltas 1.5T 5-Star Split AC Tax Invoice
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Demonstrates automatic appliance creation, warranty registration, and maintenance scheduling.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleUploadSample("AC_INVOICE")}
              disabled={processing}
              className="mt-4 w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
            >
              {processing ? "Processing Extraction..." : "Test Extract AC Invoice"}
            </button>
          </div>

          {/* Sample 2: Quick-Commerce Grocery Receipt */}
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-teal-300 transition-colors">
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-teal-700 mb-1">
                <span>Demo Sample Receipt</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">Grocery</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                Blinkit Quick-Commerce Order Bill
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Demonstrates line-item grocery extraction, inventory restock, and expense logging.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleUploadSample("GROCERY_RECEIPT")}
              disabled={processing}
              className="mt-4 w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
            >
              {processing ? "Processing Extraction..." : "Test Extract Grocery Receipt"}
            </button>
          </div>
        </div>

        {/* Review Modal: Extracted Information Confirmation */}
        {reviewDoc && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in zoom-in-95 flex flex-col max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    AI Extraction Review
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    Review Extracted Document
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Confidence score: {(reviewDoc.confidence * 100).toFixed(0)}% • Please verify fields before saving to household state.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewDoc(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Extraction Data Fields */}
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2.5">
                <div className="font-semibold text-slate-900 border-b border-slate-200 pb-2">
                  Document Type: <span className="text-teal-700">{reviewDoc.docType}</span>
                </div>

                {reviewDoc.docType === "APPLIANCE_INVOICE" && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 block">Brand &amp; Model</span>
                        <span className="font-semibold text-slate-900">
                          {String(reviewDoc.extractedData.brand)} {String(reviewDoc.extractedData.model || "")}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Purchase Price</span>
                        <span className="font-semibold text-slate-900">
                          {formatINR(Number(reviewDoc.extractedData.purchasePrice))}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 block">Serial Number</span>
                        <span className="font-mono text-slate-800">
                          {String(reviewDoc.extractedData.serialNumber || "N/A")}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Warranty Period</span>
                        <span className="font-semibold text-slate-900">
                          {String(reviewDoc.extractedData.warrantyPeriodMonths || 12)} months
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Dealer &amp; Service Info</span>
                      <span className="text-slate-700">
                        {String(reviewDoc.extractedData.retailerOrDealer || "")} •{" "}
                        {String(reviewDoc.extractedData.serviceInformation || "")}
                      </span>
                    </div>

                    <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-900 text-[11px] leading-relaxed">
                      💡 <strong>Downstream State Changes:</strong> Approving this will automatically register a new <strong>{String(reviewDoc.extractedData.brand)} AC</strong> asset, schedule first maintenance in 180 days, and display health metrics on your dashboard!
                    </div>
                  </>
                )}

                {reviewDoc.docType === "RECEIPT" && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 block">Store / Platform</span>
                        <span className="font-semibold text-slate-900">
                          {String(reviewDoc.extractedData.vendor)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Total Amount</span>
                        <span className="font-semibold text-slate-900">
                          {formatINR(Number(reviewDoc.extractedData.total))}
                        </span>
                      </div>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-500 font-medium block mb-1">
                        Detected Items to Restock:
                      </span>
                      {Array.isArray(reviewDoc.extractedData.items) &&
                        reviewDoc.extractedData.items.map((it: { name: string; quantity: number; unit?: string; price: number }, i: number) => (
                          <div key={i} className="flex justify-between text-[11px] py-0.5">
                            <span>• {it.name} ({it.quantity} {it.unit || "units"})</span>
                            <span className="font-semibold">{formatINR(it.price)}</span>
                          </div>
                        ))}
                    </div>

                    <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-900 text-[11px] leading-relaxed">
                      💡 <strong>Downstream State Changes:</strong> Approving will increase inventory quantities, recalculate depletion days, and log an expense of {formatINR(Number(reviewDoc.extractedData.total))}.
                    </div>
                  </>
                )}

                {reviewDoc.docType === "UTILITY_BILL" && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 block">Provider</span>
                        <span className="font-semibold text-slate-900">
                          {String(reviewDoc.extractedData.provider)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Bill Amount</span>
                        <span className="font-semibold text-slate-900">
                          {formatINR(Number(reviewDoc.extractedData.totalAmount))}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Due Date</span>
                      <span className="font-semibold text-slate-900">
                        {String(reviewDoc.extractedData.dueDate)}
                      </span>
                    </div>

                    <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 text-[11px] leading-relaxed">
                      💡 <strong>Downstream State Changes:</strong> Approving will record this bill in household accounts and create an urgent payment task.
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewDoc(null)}
                  className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={handleConfirmExtraction}
                  disabled={confirming}
                  className="px-4 py-2 text-xs bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {confirming ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Household State...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm &amp; Apply Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Processed Documents List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-sm">
              Ingested Document Archive ({documents.length})
            </h2>
            <span className="text-xs text-slate-400">Processed via Gemini Multimodal</span>
          </div>

          <div className="divide-y divide-slate-100">
            {documents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No documents uploaded yet. Test with one of the sample invoices above.
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{doc.title}</div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-2 mt-0.5">
                        <span>{doc.docType}</span>
                        <span>•</span>
                        <span>{formatIndianDate(doc.createdAt)}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">{doc.originalName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        doc.status === "CONFIRMED"
                          ? "bg-emerald-100 text-emerald-800"
                          : doc.status === "EXTRACTED"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {doc.status}
                    </span>

                    <Link
                      href={`/documents/${doc.id}`}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1"
                    >
                      <span>View Data</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
