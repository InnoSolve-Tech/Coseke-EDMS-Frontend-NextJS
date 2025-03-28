"use client";

import type React from "react";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Pen,
  Type,
  Square,
  Stamp,
  FilePenLine,
  Save,
  Eraser,
  Hand,
  Undo,
  Redo,
  Highlighter,
  History,
} from "lucide-react";
import { useParams } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { VersionHistory } from "./version-history";

type AnnotationTool =
  | "pen"
  | "highlighter"
  | "text"
  | "rectangle"
  | "stamp"
  | "signature"
  | "eraser"
  | "hand";

interface Annotation {
  id: string;
  type: AnnotationTool;
  points?: { x: number; y: number }[];
  text?: string;
  rect?: { x: number; y: number; width: number; height: number };
  color: string;
  lineWidth?: number;
  pageNumber: number;
  version: string;
  author: string;
  timestamp: string;
}

interface PdfViewerProps {
  url: string;
  onSave?: (annotatedPdfBlob: Blob, version?: string) => Promise<void>;
  version?: string;
  versionHistory?: { version: string; date: string }[];
}

export function PdfViewer({
  url,
  onSave,
  version = "0.0",
  versionHistory = [],
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [tool, setTool] = useState<AnnotationTool>("pen");
  const [color, setColor] = useState("#FF0000");
  const [lineWidth, setLineWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(
    null,
  );
  const [undoStack, setUndoStack] = useState<Annotation[][]>([]);
  const [redoStack, setRedoStack] = useState<Annotation[][]>([]);
  const [scale, setScale] = useState(1);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [stampText, setStampText] = useState("APPROVED");
  const [textAnnotation, setTextAnnotation] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const params = useParams();
  const documentId = params?.id || params?.fileId || params?.documentId;
  const { toast } = useToast();
  const [pdfUrl, setPdfUrl] = useState<string>(url);
  // Add state to track if we're viewing a version or the original document
  const [viewingVersion, setViewingVersion] = useState(false);

  // Add a helper function to ensure we're loading a direct PDF URL
  const ensureDirectPdfUrl = (url: string): string => {
    // If it's a blob URL, return it directly
    if (url.startsWith("blob:")) {
      return url;
    }

    // Check if the URL is already a direct PDF link
    if (url.toLowerCase().endsWith(".pdf")) {
      return url;
    }

    // If it's a relative URL, make sure it points to the PDF file
    if (url.startsWith("/")) {
      // This is a relative URL, try to extract the PDF path if it exists
      const pdfMatch = url.match(/\/([^/]+\.pdf)/i);
      if (pdfMatch) {
        return pdfMatch[0];
      }
    }

    // If it contains a PDF filename in the path, extract it
    const pdfInPath = url.match(/\/([^/]+\.pdf)/i);
    if (pdfInPath) {
      // Try to extract just the PDF part of the URL
      return pdfInPath[0];
    }

    // If we can't determine a direct PDF URL, return the original
    // but log a warning
    console.warn("Could not determine direct PDF URL from:", url);
    return url;
  };

  // Check for valid URL
  useEffect(() => {
    // Always initialize with the provided URL
    setPdfUrl(url);
    setViewingVersion(false);

    if (!url) {
      toast({
        title: "No document",
        description: "No PDF document provided.",
        variant: "destructive",
      });
    } else {
      console.log("PDF URL set to:", url);
      // Reset loading state to trigger iframe reload
      setIsLoading(true);
    }
  }, [url, toast]);

  useEffect(() => {
    console.log("Params:", params);
    console.log("Document ID from path:", documentId);
  }, [params]);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current || !iframeRef.current)
      return;

    const resizeCanvas = () => {
      if (!containerRef.current || !canvasRef.current || !iframeRef.current)
        return;

      const iframe = iframeRef.current;
      const canvas = canvasRef.current;

      // Set canvas dimensions to match the iframe document size
      const rect = iframe.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Align canvas with the PDF
      canvas.style.position = "absolute";
      canvas.style.top = `${iframe.offsetTop}px`;
      canvas.style.left = `${iframe.offsetLeft}px`;

      // Only enable pointer events when not in hand mode
      canvas.style.pointerEvents = tool === "hand" ? "none" : "auto";

      drawAnnotations(currentPage);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [tool]); // Add tool as a dependency to re-run when tool changes

  useEffect(() => {
    const updateCanvasPositionAndSize = () => {
      if (!iframeRef.current || !canvasRef.current) return;

      const iframe = iframeRef.current;
      const canvas = canvasRef.current;
      const rect = iframe.getBoundingClientRect();

      // Set canvas dimensions to match the iframe document size
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Align canvas with the PDF viewport
      canvas.style.top = `${iframe.offsetTop}px`;
      canvas.style.left = `${iframe.offsetLeft}px`;

      // Apply scale transformation
      canvas.style.transform = `scale(${scale})`;
      canvas.style.transformOrigin = "top left";

      drawAnnotations(currentPage);
    };

    updateCanvasPositionAndSize();
    window.addEventListener("resize", updateCanvasPositionAndSize);
    window.addEventListener("scroll", updateCanvasPositionAndSize);
    return () => {
      window.removeEventListener("resize", updateCanvasPositionAndSize);
      window.removeEventListener("scroll", updateCanvasPositionAndSize);
    };
  }, [tool, scale, currentPage]);

  const drawAnnotations = (pageNumber: number) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Filter annotations for the current page
    const pageAnnotations = annotations.filter(
      (anno) => anno.pageNumber === pageNumber,
    );

    // Draw each annotation with scale adjustment
    context.save();
    context.scale(scale, scale);
    pageAnnotations.forEach((annotation) => {
      context.strokeStyle = annotation.color;
      context.fillStyle = annotation.color;
      context.lineWidth = (annotation.lineWidth || 2) / scale;

      switch (annotation.type) {
        case "pen":
        case "highlighter":
          if (annotation.points && annotation.points.length > 1) {
            context.beginPath();
            context.moveTo(
              annotation.points[0].x / scale,
              annotation.points[0].y / scale,
            );
            for (let i = 1; i < annotation.points.length; i++) {
              context.lineTo(
                annotation.points[i].x / scale,
                annotation.points[i].y / scale,
              );
            }
            context.stroke();
          }
          break;

        case "text":
          if (
            annotation.text &&
            annotation.points &&
            annotation.points.length > 0
          ) {
            const point = annotation.points[0];
            context.font = `16px Arial`;
            context.fillText(annotation.text, point.x / scale, point.y / scale);
          }
          break;

        case "rectangle":
          if (annotation.rect) {
            const { x, y, width, height } = annotation.rect;
            context.strokeRect(
              x / scale,
              y / scale,
              width / scale,
              height / scale,
            );
          }
          break;

        case "stamp":
          if (
            annotation.text &&
            annotation.points &&
            annotation.points.length > 0
          ) {
            const point = annotation.points[0];
            context.save();
            context.translate(point.x / scale, point.y / scale);
            context.rotate(-Math.PI / 8);
            context.font = "bold 24px Arial";
            context.strokeStyle = annotation.color;
            context.lineWidth = 2 / scale;
            context.strokeText(annotation.text, 0, 0);
            context.restore();
          }
          break;

        case "signature":
          if (
            annotation.points &&
            annotation.points.length > 0 &&
            signatureDataUrl
          ) {
            const point = annotation.points[0];
            const img = document.createElement("img");
            img.crossOrigin = "anonymous";
            img.onload = () => {
              context.drawImage(
                img,
                point.x / scale,
                point.y / scale,
                200 / scale,
                100 / scale,
              );
            };
            img.src = signatureDataUrl;
          }
          break;
      }
    });
    context.restore();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || isLoading) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Ensure the annotation starts within the canvas area
    if (x < 0 || x > rect.width || y < 0 || y > rect.height) return;

    setIsDrawing(true);

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: tool,
      color,
      lineWidth,
      pageNumber: currentPage,
      version,
      author: "Current User",
      timestamp: new Date().toISOString(),
    };

    if (tool === "pen" || tool === "highlighter") {
      newAnnotation.points = [{ x, y }];
    } else if (tool === "text") {
      setShowTextInput(true);
      setTextPosition({ x, y });
      newAnnotation.points = [{ x, y }];
    } else if (tool === "rectangle") {
      newAnnotation.rect = { x, y, width: 0, height: 0 };
    } else if (tool === "stamp") {
      newAnnotation.points = [{ x, y }];
      newAnnotation.text = stampText;
    }

    setCurrentAnnotation(newAnnotation);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // Prevent drawing outside the PDF viewer
    x = Math.max(0, Math.min(rect.width, x));
    y = Math.max(0, Math.min(rect.height, y));

    const updatedAnnotation = { ...currentAnnotation };

    if (
      updatedAnnotation.type === "pen" ||
      updatedAnnotation.type === "highlighter"
    ) {
      updatedAnnotation.points = [
        ...(updatedAnnotation.points || []),
        { x, y },
      ];
    } else if (
      updatedAnnotation.type === "rectangle" &&
      updatedAnnotation.rect
    ) {
      const startX = updatedAnnotation.rect.x;
      const startY = updatedAnnotation.rect.y;
      updatedAnnotation.rect = {
        x: Math.min(startX, x),
        y: Math.min(startY, y),
        width: Math.abs(x - startX),
        height: Math.abs(y - startY),
      };
    }

    setCurrentAnnotation(updatedAnnotation);
    drawAnnotations(currentPage);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentAnnotation) return;

    if (currentAnnotation.type === "text") {
      // For text annotations, we'll handle them separately
      setIsDrawing(false);
      return;
    }

    // Add the completed annotation to the annotations array
    setUndoStack([...undoStack, annotations]);
    setRedoStack([]);
    setAnnotations([...annotations, currentAnnotation]);

    setIsDrawing(false);
    setCurrentAnnotation(null);

    // Redraw the canvas
    drawAnnotations(currentPage);
  };

  const handleTextAnnotationSubmit = () => {
    if (!currentAnnotation || !textAnnotation.trim()) {
      setShowTextInput(false);
      setCurrentAnnotation(null);
      return;
    }

    const completedAnnotation = {
      ...currentAnnotation,
      text: textAnnotation,
    };

    setUndoStack([...undoStack, annotations]);
    setRedoStack([]);
    setAnnotations([...annotations, completedAnnotation]);

    setShowTextInput(false);
    setTextAnnotation("");
    setCurrentAnnotation(null);

    // Redraw the canvas
    drawAnnotations(currentPage);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const previousAnnotations = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);

    setRedoStack([...redoStack, annotations]);
    setUndoStack(newUndoStack);
    setAnnotations(previousAnnotations);

    // Redraw the canvas
    drawAnnotations(currentPage);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const nextAnnotations = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    setUndoStack([...undoStack, annotations]);
    setRedoStack(newRedoStack);
    setAnnotations(nextAnnotations);

    // Redraw the canvas
    drawAnnotations(currentPage);
  };

  const handleSave = async () => {
    if (!canvasRef.current || !iframeRef.current) return;

    try {
      // In a real implementation, you would save the annotations to your backend
      // and/or generate a new PDF with the annotations embedded

      // For this example, we'll create a composite image of the PDF and annotations
      const canvas = document.createElement("canvas");
      const iframe = iframeRef.current;
      const rect = iframe.getBoundingClientRect();

      canvas.width = rect.width;
      canvas.height = rect.height;

      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not get canvas context");

      // Create a screenshot of the iframe (this is a simplified approach)
      // In a real implementation, you would use PDF.js to render the PDF to the canvas
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the annotations on top
      const annotationCanvas = canvasRef.current;
      context.drawImage(annotationCanvas, 0, 0);

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob from canvas"));
        }, "image/png");
      });

      if (onSave) {
        await onSave(blob, version);
      } else {
        // Download the annotated PDF
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "annotated-document.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Success",
        description: "Document saved successfully",
      });
    } catch (error) {
      console.error("Error saving annotations:", error);
      toast({
        title: "Error",
        description: "Failed to save document",
        variant: "destructive",
      });
    }
  };

  const handleSignatureStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!signatureCanvasRef.current) return;

    const canvas = signatureCanvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleSignatureMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !signatureCanvasRef.current) return;

    const canvas = signatureCanvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.lineTo(x, y);
    context.stroke();
  };

  const handleSignatureEnd = () => {
    if (!signatureCanvasRef.current) return;

    setIsDrawing(false);

    // Save the signature as a data URL
    const dataUrl = signatureCanvasRef.current.toDataURL();
    setSignatureDataUrl(dataUrl);
  };

  const handleClearSignature = () => {
    if (!signatureCanvasRef.current) return;

    const canvas = signatureCanvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSaveSignature = () => {
    if (!signatureDataUrl) {
      toast({
        title: "Error",
        description: "Please draw a signature first",
        variant: "destructive",
      });
      return;
    }

    setIsSignatureModalOpen(false);
  };

  // Modify the handleVersionSelect function to set the viewingVersion flag
  const handleVersionSelect = (versionId: number, fileUrl: string) => {
    console.log(`Loading version ${versionId} with URL: ${fileUrl}`);

    // Update the PDF URL to load the selected version
    setPdfUrl(fileUrl);

    // Set flag that we're viewing a version, not the original
    setViewingVersion(true);

    // Reset annotations when switching versions
    setAnnotations([]);
    setUndoStack([]);
    setRedoStack([]);

    // Reset loading state to trigger the iframe onLoad event
    setIsLoading(true);

    // Close the version history dialog
    setShowVersionHistory(false);

    toast({
      title: "Version Loaded",
      description: `Loaded version ${versionId}`,
    });
  };

  // Add a function to return to the original document
  const handleViewOriginal = () => {
    console.log("Loading original document with URL:", url);

    // Reset to the original document URL
    setPdfUrl(url);

    // Set flag that we're viewing the original, not a version
    setViewingVersion(false);

    // Reset annotations
    setAnnotations([]);
    setUndoStack([]);
    setRedoStack([]);

    // Reset loading state
    setIsLoading(true);

    toast({
      title: "Original Document",
      description: "Loaded original document",
    });
  };

  const handleZoomIn = () => {
    setScale(scale + 0.1);
    // In a real implementation, you would zoom the PDF
  };

  const handleZoomOut = () => {
    if (scale > 0.5) {
      setScale(scale - 0.1);
      // In a real implementation, you would zoom the PDF
    }
  };

  return (
    <div className="flex flex-col h-full" ref={containerRef}>
      {/* Hidden file input */}
      {/* <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf" onChange={handleFileChange} /> */}

      {/* Toolbar */}
      <div className="overflow-x-auto border-b bg-muted/20">
        <div className="flex items-center justify-between p-2 min-w-max">
          <div className="flex items-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={tool === "pen" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setTool("pen")}
                  >
                    <Pen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Pen</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={tool === "highlighter" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setTool("highlighter")}
                  >
                    <Highlighter className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Highlighter</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={tool === "text" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setTool("text")}
                  >
                    <Type className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Text</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={tool === "rectangle" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setTool("rectangle")}
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rectangle</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={tool === "stamp" ? "default" : "outline"}
                        size="icon"
                      >
                        <Stamp className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-4">
                        <h4 className="font-medium">Stamp</h4>
                        <div className="space-y-2">
                          <Label htmlFor="stampText">Stamp Text</Label>
                          <Input
                            id="stampText"
                            value={stampText}
                            onChange={(e) => setStampText(e.target.value)}
                          />
                        </div>
                        <Button onClick={() => setTool("stamp")}>
                          Apply Stamp
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </TooltipTrigger>
                <TooltipContent>Stamp</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={tool === "signature" ? "default" : "outline"}
                    size="icon"
                    onClick={() => {
                      setTool("signature");
                      if (!signatureDataUrl) {
                        setIsSignatureModalOpen(true);
                      }
                    }}
                  >
                    <FilePenLine className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Signature</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={tool === "eraser" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setTool("eraser")}
                  >
                    <Eraser className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Eraser</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={tool === "hand" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setTool("hand")}
                  >
                    <Hand className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Hand (Pan)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center space-x-1 ml-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  <div
                    className="h-4 w-4 rounded-sm border"
                    style={{ backgroundColor: color }}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40">
                <div className="grid grid-cols-5 gap-2">
                  {[
                    "#FF0000",
                    "#00FF00",
                    "#0000FF",
                    "#FFFF00",
                    "#FF00FF",
                    "#00FFFF",
                    "#000000",
                    "#FFFFFF",
                    "#FF8800",
                    "#8800FF",
                  ].map((c) => (
                    <div
                      key={c}
                      className="h-6 w-6 cursor-pointer rounded-sm border"
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  Width: {lineWidth}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium">Line Width</h4>
                  <Slider
                    value={[lineWidth]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={(value) => setLineWidth(value[0])}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-1 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
            >
              <Undo className="h-4 w-4 mr-1" /> Undo
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
            >
              <Redo className="h-4 w-4 mr-1" /> Redo
            </Button>

            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVersionHistory(true)}
            >
              <History className="h-4 w-4 mr-1" /> Version History
            </Button>
            {viewingVersion && (
              <Button variant="outline" size="sm" onClick={handleViewOriginal}>
                <History className="h-4 w-4 mr-1" /> View Original
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              -
            </Button>
            <span className="text-sm">{Math.round(scale * 100)}%</span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              +
            </Button>
          </div>
        </div>
      </div>

      {/* PDF viewer with annotation overlay */}
      <div className="flex-1 overflow-auto p-4 flex justify-center bg-muted/20">
        {isLoading && (
          <Skeleton className="h-[500px] w-full max-w-3xl rounded-lg" />
        )}

        {url ? (
          <div
            className="relative border rounded-lg shadow-sm"
            style={{ width: "100%", maxWidth: "800px", height: "600px" }}
          >
            {/* PDF iframe */}
            <iframe
              ref={iframeRef}
              src={
                pdfUrl.startsWith("blob:")
                  ? pdfUrl
                  : `${ensureDirectPdfUrl(pdfUrl)}#toolbar=0&view=FitH&t=${Date.now()}`
              }
              className="w-full h-full"
              style={{ border: "none" }}
              onLoad={() => {
                setIsLoading(false);
                console.log("PDF iframe loaded successfully");
                // Ensure canvas is resized after PDF loads
                if (
                  containerRef.current &&
                  canvasRef.current &&
                  iframeRef.current
                ) {
                  const iframe = iframeRef.current;
                  const canvas = canvasRef.current;
                  const rect = iframe.getBoundingClientRect();
                  canvas.width = rect.width;
                  canvas.height = rect.height;
                }
              }}
              onError={() => {
                console.error("Failed to load PDF:", pdfUrl);
                setIsLoading(false);
                toast({
                  title: "Error",
                  description: "Failed to load PDF document",
                  variant: "destructive",
                });
              }}
            />

            {/* Canvas overlay for annotations */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
              style={{ pointerEvents: "auto", backgroundColor: "transparent" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
        ) : (
          <p className="text-gray-500 text-center">No PDF file available</p>
        )}
      </div>

      {/* Text annotation input */}
      {showTextInput && (
        <div
          className="absolute bg-white p-4 border shadow-md rounded-md"
          style={{
            left: textPosition.x + "px",
            top: textPosition.y + "px",
            zIndex: 1000,
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="textAnnotation">Text Annotation</Label>
            <Textarea
              id="textAnnotation"
              value={textAnnotation}
              onChange={(e) => setTextAnnotation(e.target.value)}
              className="w-64"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowTextInput(false);
                  setCurrentAnnotation(null);
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleTextAnnotationSubmit}>
                Add
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Signature modal */}
      {isSignatureModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Create Signature</h3>
            <div className="border border-dashed p-2 mb-4">
              <canvas
                ref={signatureCanvasRef}
                width={400}
                height={200}
                className="w-full h-48 border bg-white cursor-crosshair"
                onMouseDown={handleSignatureStart}
                onMouseMove={handleSignatureMove}
                onMouseUp={handleSignatureEnd}
                onMouseLeave={handleSignatureEnd}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleClearSignature}>
                Clear
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsSignatureModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveSignature}>Save Signature</Button>
            </div>
          </div>
        </div>
      )}

      {/* Version creation dialog */}
      {/* {showVersionDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Create New Version</h3>
            <div className="space-y-4">
              {/* File upload section */}
      {/* <div className="space-y-2">
                <Label htmlFor="versionFile">Upload Document</Label>
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    id="versionFile"
                    ref={fileInputRef}
                    className="hidden"
                    accept="application/pdf"
                    onChange={handleFileChange}
                  />
                  {uploadedFile ? (
                    <div className="flex flex-col items-center">
                      <p className="font-medium text-sm">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">Click to upload a PDF file</p>
                      <p className="text-xs text-muted-foreground">or drag and drop</p>
                    </div>
                  )}
                </div>
              </div> */}

      {/* Version comment */}
      {/* <div className="space-y-2">
                <Label htmlFor="versionComment">Version Comment</Label>
                <Textarea
                  id="versionComment"
                  placeholder="Describe the changes in this version..."
                  value={versionComment}
                  onChange={(e) => setVersionComment(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div> */}

      {/* Version type selection with radio buttons */}
      {/* <div className="space-y-2">
                <p className="text-sm font-medium">Version Type</p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="minorVersion"
                      name="versionType"
                      className="h-4 w-4"
                      checked={selectedVersionType === "M INOR"}
                      onChange={() => setSelectedVersionType("MINOR")}
                    />
                    <Label htmlFor="minorVersion" className="cursor-pointer">
                      <span className="font-medium">Minor Version</span>
                      <span className="ml-2 text-sm text-muted-foreground">(Next: {suggestedVersions.minor})</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="majorVersion"
                      name="versionType"
                      className="h-4 w-4"
                      checked={selectedVersionType === "MAJOR"}
                      onChange={() => setSelectedVersionType("MAJOR")}
                    />
                    <Label htmlFor="majorVersion" className="cursor-pointer">
                      <span className="font-medium">Major Version</span>
                      <span className="ml-2 text-sm text-muted-foreground">(Next: {suggestedVersions.major})</span>
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowVersionDialog(false)
                    setUploadedFile(null)
                    setVersionComment("")
                    if (uploadedFileUrl) {
                      URL.revokeObjectURL(uploadedFileUrl)
                      setUploadedFileUrl(null)
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={() => handleCreateVersion(selectedVersionType)} disabled={!uploadedFile}>
                  Create Version
                </Button>
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* Version History Dialog */}
      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="max-w-4xl h-[80vh]">
          {documentId && (
            <VersionHistory
              documentId={Number(documentId)}
              onVersionSelect={handleVersionSelect}
              onClose={() => setShowVersionHistory(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
