"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { FormRecord } from "@/lib/types/formRecords";
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { pdfjs, Document as PDFDocument, Page as PDFPage } from "react-pdf";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  field: {
    fontSize: 12,
    marginBottom: 5,
  },
});

interface RecordDetailsDialogProps {
  record: FormRecord;
  onClose: () => void;
}

const RecordPDF = ({ record }: { record: FormRecord }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>Form Record Details</Text>
        <Text style={styles.field}>ID: {record.id}</Text>
        <Text style={styles.field}>
          Created Date:{" "}
          {new Date(record.createdDate!.toString()).toLocaleString()}
        </Text>
        {Object.entries(record.formFieldValues).map(([key, value]) => (
          <Text key={key} style={styles.field}>
            {key}: {value.value}
          </Text>
        ))}
      </View>
    </Page>
  </Document>
);

export default function RecordDetailsDialog({
  record,
  onClose,
}: RecordDetailsDialogProps) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  useEffect(() => {
    async function generatePDF() {
      const pdfDoc = <RecordPDF record={record} />;
      const pdfString = await pdf(pdfDoc).toBlob();
      setPdfBlob(pdfString);
    }
    generatePDF();
  }, [record]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

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
          {pdfBlob && (
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">PDF Preview</h3>
              <PDFDocument
                file={URL.createObjectURL(pdfBlob)}
                onLoadSuccess={onDocumentLoadSuccess}
              >
                <PDFPage pageNumber={pageNumber} />
              </PDFDocument>
              <p className="mt-2">
                Page {pageNumber} of {numPages}
              </p>
              <div className="flex justify-between mt-2">
                <Button
                  onClick={() => setPageNumber(pageNumber - 1)}
                  disabled={pageNumber <= 1}
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setPageNumber(pageNumber + 1)}
                  disabled={pageNumber >= (numPages || 0)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
