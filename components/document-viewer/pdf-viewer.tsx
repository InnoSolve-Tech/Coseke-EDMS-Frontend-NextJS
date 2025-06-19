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
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
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
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);

  // State
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
  const [pdfUrl, setPdfUrl] = useState<string>(url);
  const [viewingVersion, setViewingVersion] = useState(false);

  const params = useParams();
  const documentId = params?.id || params?.fileId || params?.documentId;
  const { toast } = useToast();

  // Helper function to ensure direct PDF URL
  const ensureDirectPdfUrl = (url: string): string => {
    if (url.startsWith("blob:")) return url;
    if (url.toLowerCase().endsWith(".pdf")) return url;

    const pdfMatch = url.match(/\/([^/]+\.pdf)/i);
    if (pdfMatch) return pdfMatch[0];

    console.warn("Could not determine direct PDF URL from:", url);
    return url;
  };

  // Initialize with provided URL
  useEffect(() => {
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
      setIsLoading(true);
    }
  }, [url, toast]);

  // Resize canvas when tool changes
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current || !iframeRef.current)
      return;

    const resizeCanvas = () => {
      if (!containerRef.current || !canvasRef.current || !iframeRef.current)
        return;

      const iframe = iframeRef.current;
      const canvas = canvasRef.current;

      const rect = iframe.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      canvas.style.position = "absolute";
      canvas.style.top = `${iframe.offsetTop}px`;
      canvas.style.left = `${iframe.offsetLeft}px`;

      canvas.style.pointerEvents = tool === "hand" ? "none" : "auto";

      drawAnnotations(currentPage);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [tool, currentPage]);

  // Update canvas position and size when scale or page changes
  useEffect(() => {
    const updateCanvasPositionAndSize = () => {
      if (!iframeRef.current || !canvasRef.current) return;

      const iframe = iframeRef.current;
      const canvas = canvasRef.current;
      const rect = iframe.getBoundingClientRect();

      canvas.width = rect.width;
      canvas.height = rect.height;

      canvas.style.top = `${iframe.offsetTop}px`;
      canvas.style.left = `${iframe.offsetLeft}px`;

      canvas.style.transform = `scale(${scale})`;
      canvas.style.transformOrigin = "top left";

      // Only enable pointer events when not in hand mode
      canvas.style.pointerEvents = tool === "hand" ? "none" : "auto";

      drawAnnotations(currentPage);
    };

    updateCanvasPositionAndSize();

    const handlers = ["resize", "scroll"];
    handlers.forEach((event) =>
      window.addEventListener(event, updateCanvasPositionAndSize),
    );

    return () => {
      handlers.forEach((event) =>
        window.removeEventListener(event, updateCanvasPositionAndSize),
      );
    };
  }, [tool, scale, currentPage]);

  // Draw annotations on canvas
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
            const img = new Image();
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

  // Mouse event handlers for annotations
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    // If in hand mode or holding the Ctrl key (for zoom), let the event pass through
    if (tool === "hand" || e.ctrlKey) {
      return;
    }

    // Otherwise, prevent default to avoid accidental drawing while scrolling
    e.stopPropagation();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || isLoading || tool === "hand") return;

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
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

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

  // Text annotation handlers
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

  // Undo/Redo handlers
  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const previousAnnotations = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);

    setRedoStack([...redoStack, annotations]);
    setUndoStack(newUndoStack);
    setAnnotations(previousAnnotations);

    drawAnnotations(currentPage);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const nextAnnotations = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    setUndoStack([...undoStack, annotations]);
    setRedoStack(newRedoStack);
    setAnnotations(nextAnnotations);

    drawAnnotations(currentPage);
  };

  // Save handler
  const handleSave = async () => {
    if (!canvasRef.current || !iframeRef.current) return;

    try {
      // Create a composite image of the PDF and annotations
      const canvas = document.createElement("canvas");
      const iframe = iframeRef.current;
      const rect = iframe.getBoundingClientRect();

      canvas.width = rect.width;
      canvas.height = rect.height;

      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not get canvas context");

      // Create a white background
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

  // Signature handlers
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
    setSignatureDataUrl(signatureCanvasRef.current.toDataURL());
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

  // Version handling
  const handleVersionSelect = (versionId: number, fileUrl: string) => {
    console.log(`Loading version ${versionId} with URL: ${fileUrl}`);

    setPdfUrl(fileUrl);
    setViewingVersion(true);
    setAnnotations([]);
    setUndoStack([]);
    setRedoStack([]);
    setIsLoading(true);
    setShowVersionHistory(false);

    toast({
      title: "Version Loaded",
      description: `Loaded version ${versionId}`,
    });
  };

  const handleViewOriginal = () => {
    console.log("Loading original document with URL:", url);

    setPdfUrl(url);
    setViewingVersion(false);
    setAnnotations([]);
    setUndoStack([]);
    setRedoStack([]);
    setIsLoading(true);

    toast({
      title: "Original Document",
      description: "Loaded original document",
    });
  };

  // Page navigation
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setScale(Math.min(scale + 0.1, 2.0));
  };

  const handleZoomOut = () => {
    setScale(Math.max(scale - 0.1, 0.5));
  };

  // Detect total pages from PDF
  const detectTotalPages = () => {
    if (!iframeRef.current) return;

    try {
      // This is a simplified approach - in a real implementation,
      // you would use PDF.js to get the total page count
      const iframe = iframeRef.current;
      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow?.document;

      if (iframeDoc) {
        // For demonstration, we'll set a default of 10 pages
        // In a real implementation, you would extract this from the PDF
        setTotalPages(10);
      }
    } catch (error) {
      console.error("Error detecting total pages:", error);
    }
  };

  return (
    <div className="flex flex-col h-full" ref={containerRef}>
      {/* Toolbar */}
      <div className="overflow-x-auto border-b bg-muted/20">
        <div className="flex items-center justify-between p-2 min-w-max">
          {/* Annotation tools */}
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

          {/* Color and line width */}
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

          {/* Actions */}
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
          </div>

          {/* Zoom controls */}
          <div className="flex items-center space-x-1 ml-4">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm">{Math.round(scale * 100)}%</span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* PDF viewer with annotation overlay */}
      <div className="flex-1 overflow-auto p-4 flex flex-col items-center bg-muted/20">
        {isLoading && (
          <Skeleton className="h-[500px] w-full max-w-3xl rounded-lg" />
        )}

        {url ? (
          <>
            <div
              className="relative border rounded-lg shadow-sm mb-4"
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
                style={{
                  border: "none",
                  pointerEvents: "auto",
                }}
                onLoad={() => {
                  setIsLoading(false);
                  console.log("PDF iframe loaded successfully");

                  // Resize canvas after PDF loads
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

                  // Detect total pages
                  detectTotalPages();
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
                style={{
                  pointerEvents: tool === "hand" ? "none" : "auto",
                  backgroundColor: "transparent",
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              />
            </div>

            {/* Page navigation */}
            <div className="flex items-center justify-center space-x-4 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>

              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
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
