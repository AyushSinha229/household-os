import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { processDocumentFile } from "@/lib/ai/document-processor";

export async function GET() {
  try {
    const household = await prisma.household.findFirst();
    if (!household) return NextResponse.json({ error: "Household not found" }, { status: 404 });

    const documents = await prisma.document.findMany({
      where: { householdId: household.id },
      include: { extractions: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Fetch documents error:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, fileType, base64Data, sampleType } = body;

    const household = await prisma.household.findFirst();
    if (!household) return NextResponse.json({ error: "Household not found" }, { status: 404 });

    // Determine target file name and type
    let effectiveFileName = fileName || "Document.pdf";
    let effectiveFileType = fileType || "application/pdf";

    if (sampleType === "AC_INVOICE") {
      effectiveFileName = "Voltas_1.5T_Inverter_AC_Tax_Invoice.pdf";
      effectiveFileType = "application/pdf";
    } else if (sampleType === "GROCERY_RECEIPT") {
      effectiveFileName = "Blinkit_Quick_Commerce_Receipt.png";
      effectiveFileType = "image/png";
    } else if (sampleType === "ELECTRICITY_BILL") {
      effectiveFileName = "Tata_Power_Mumbai_Electricity_Bill.pdf";
      effectiveFileType = "application/pdf";
    }

    // Process document through multimodal AI or intelligent parser
    const processed = await processDocumentFile({
      fileName: effectiveFileName,
      fileType: effectiveFileType,
      base64Data,
    });

    // Save in Document table
    const doc = await prisma.document.create({
      data: {
        householdId: household.id,
        title: effectiveFileName.replace(/_/g, " ").replace(/\.[^/.]+$/, ""),
        originalName: effectiveFileName,
        fileType: effectiveFileType,
        fileSize: base64Data ? Math.round(base64Data.length * 0.75) : 156000,
        status: "EXTRACTED",
        docType: processed.docType,
        extractedJson: JSON.stringify(processed.data),
        confidenceScore: processed.confidenceScore,
        rawText: processed.rawSummary,
      },
    });

    // Create DocumentExtraction record
    const extraction = await prisma.documentExtraction.create({
      data: {
        documentId: doc.id,
        extractedType: processed.docType,
        vendorOrBrand:
          (processed.data as { brand?: string; vendor?: string; provider?: string }).brand ||
          (processed.data as { vendor?: string }).vendor ||
          (processed.data as { provider?: string }).provider,
        invoiceNumber:
          (processed.data as { billNumber?: string; serialNumber?: string }).billNumber ||
          (processed.data as { serialNumber?: string }).serialNumber,
        totalAmount:
          (processed.data as { total?: number; purchasePrice?: number; totalAmount?: number }).total ||
          (processed.data as { purchasePrice?: number }).purchasePrice ||
          (processed.data as { totalAmount?: number }).totalAmount,
        lineItems: JSON.stringify(processed.data),
        downstreamApplied: false,
      },
    });

    return NextResponse.json({
      success: true,
      document: doc,
      extraction,
      extractedData: processed.data,
      summary: processed.rawSummary,
      confidence: processed.confidenceScore,
    });
  } catch (error) {
    console.error("Document upload/process error:", error);
    return NextResponse.json({ error: "Failed to process document" }, { status: 500 });
  }
}
