"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { FormRecord } from "@/lib/types/formRecords"
import { PDFDownloadLink, pdf } from "@react-pdf/renderer"
import { useEffect, useState } from "react"
import { RecordPDF } from "./RecordPdf"
import {
  Calendar,
  Download,
  Eye,
  FileText,
  Hash,
  Loader2,
  User,
  AlertCircle,
} from "lucide-react"

interface RecordDetailsDialogProps {
  record: FormRecord
  onClose: () => void
}

export default function RecordDetailsDialog({ record, onClose }: RecordDetailsDialogProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(true)
  const [pdfError, setPdfError] = useState<string | null>(null)

  useEffect(() => {
    let url: string | null = null
    let cancelled = false

    async function generatePDF() {
      try {
        setIsGeneratingPdf(true)
        setPdfError(null)
        const pdfDoc = <RecordPDF record={record} />
        const pdfBlob = await pdf(pdfDoc).toBlob()
        if (cancelled) return
        url = URL.createObjectURL(pdfBlob)
        setPdfUrl(url)
      } catch (error) {
        console.error("Error generating PDF:", error)
        if (!cancelled) setPdfError("Failed to generate PDF")
      } finally {
        if (!cancelled) setIsGeneratingPdf(false)
      }
    }

    generatePDF()

    return () => {
      cancelled = true
      if (url) {
        URL.revokeObjectURL(url)
      }
    }
  }, [record])

  const formatFieldKey = (key: string) =>
    key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()).trim()

  const getFieldIcon = (key: string) => {
    const lowerKey = key.toLowerCase()
    if (lowerKey.includes("name") || lowerKey.includes("user")) return User
    if (lowerKey.includes("date") || lowerKey.includes("time")) return Calendar
    if (lowerKey.includes("id") || lowerKey.includes("number")) return Hash
    return FileText
  }

  const createdDate = new Date(record.createdDate!.toString())
  const formattedDate = createdDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const formattedTime = createdDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <Dialog open={true} onOpenChange={onClose}>
      {/* Root content is a flex column with a bounded max height and min-h-0 so children can shrink */}
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col min-h-0">
        {/* Header stays fixed */}
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-accent/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Record Details</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Complete information for record #{record.id}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* ScrollArea must be allowed to shrink — use h-0 flex-1 min-h-0 */}
        <ScrollArea className="h-0 flex-1 min-h-0">
          {/* content inside scroll area — padding kept here */}
          <div className="px-6 py-4 space-y-6 min-h-0">
            {/* Form Fields Card */}
            <Card className="border-l-4 border-l-accent">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-accent" />
                  Form Data
                  <Badge variant="outline" className="ml-auto">
                    {Object.keys(record.formFieldValues).length} fields
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {Object.entries(record.formFieldValues).map(([key, value], index) => {
                    const IconComponent = getFieldIcon(key)
                    return (
                      <div key={key} className="group">
                        <div className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/30 transition-colors">
                          <div className="p-2 bg-muted/50 rounded-lg group-hover:bg-primary/10 transition-colors">
                            <IconComponent className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground mb-1">
                              {formatFieldKey(key)}
                            </h4>
                            <p className="text-muted-foreground break-words">
                              {value.value || "No value provided"}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Field {index + 1}
                          </Badge>
                        </div>
                        {index < Object.entries(record.formFieldValues).length - 1 && (
                          <Separator className="my-2 opacity-50" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* PDF Export Card */}
            <Card className="border-l-4 border-l-secondary">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Download className="h-5 w-5 text-secondary" />
                  Document Export
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                    <div className="p-2 bg-secondary/10 rounded-full">
                      <FileText className="h-4 w-4 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">PDF Document</p>
                      <p className="text-sm text-muted-foreground">
                        Complete record information in PDF format
                      </p>
                    </div>
                    {isGeneratingPdf ? (
                      <Button disabled className="gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </Button>
                    ) : pdfError ? (
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">Error generating PDF</span>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {pdfUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(pdfUrl, "_blank")}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Preview
                          </Button>
                        )}
                        <PDFDownloadLink
                          document={<RecordPDF record={record} />}
                          fileName={`record_${record.id}_${new Date()
                            .toISOString()
                            .split("T")[0]}.pdf`}
                        >
                          {({ loading }) =>
                            loading ? (
                              <Button disabled className="gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading...
                              </Button>
                            ) : (
                              <Button className="gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                                <Download className="h-4 w-4" />
                                Download PDF
                              </Button>
                            )
                          }
                        </PDFDownloadLink>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Footer stays fixed */}
        <div className="px-6 py-4 border-t bg-muted/20 flex justify-end gap-3 flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Edit Record
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
