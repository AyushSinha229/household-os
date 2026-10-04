import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { applyDownstreamDocumentChanges } from "@/lib/services/document-applier";

export async function POST(req: NextRequest) {
  try {
    const { documentId, docType, confirmedData } = await req.json();

    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const effectiveType = docType || doc.docType;
    const effectiveData = confirmedData || (doc.extractedJson ? JSON.parse(doc.extractedJson) : null);

    if (!effectiveData) {
      return NextResponse.json({ error: "No extracted data available to confirm" }, { status: 400 });
    }

    // Apply downstream database mutations
    const result = await applyDownstreamDocumentChanges({
      documentId: doc.id,
      householdId: doc.householdId,
      docType: effectiveType,
      extractedData: effectiveData,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      result,
    });
  } catch (error: unknown) {
    console.error("Document confirmation error:", error);
    const message = error instanceof Error ? error.message : "Failed to apply document changes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
