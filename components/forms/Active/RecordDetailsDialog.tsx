"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FormRecord } from "@/lib/types/formRecords";
import { PDFDownloadLink, pdf } from "@react-pdf/renderer";
import { useEffect, useState } from "react";
import { RecordPDF } from "./RecordPdf";

interface RecordDetailsDialogProps {
  record: FormRecord;
  onClose: () => void;
}

export default function RecordDetailsDialog({
  record,
  onClose,
}: RecordDetailsDialogProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    async function generatePDF() {
      const pdfDoc = <RecordPDF record={record} />;
      const pdfBlob = await pdf(pdfDoc).toBlob();
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);

      // Clean up the object URL when component unmounts
      return () => {
        URL.revokeObjectURL(url);
      };
    }
    generatePDF();
  }, [record]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Record Details</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-lg font-semibold">ID: {record.id}</h3>
            <p>
              Created Date:{" "}
              {new Date(record.createdDate!.toString()).toLocaleString()}
            </p>
          </div>
          {Object.entries(record.formFieldValues).map(([key, value]) => (
            <div key={key}>
              <h4 className="font-medium">{key}</h4>
              <p>{value.value}</p>
            </div>
          ))}
          <div className="flex justify-between items-center">
            <PDFDownloadLink
              document={<RecordPDF record={record} />}
              fileName="form_record.pdf"
            >
              {({ blob, url, loading, error }) =>
                loading ? "Loading document..." : <Button>Download PDF</Button>
              }
            </PDFDownloadLink>
          </div>
          {pdfUrl && (
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">PDF Preview</h3>
              <div className="w-full h-96">
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-0"
                  title="PDF Preview"
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
