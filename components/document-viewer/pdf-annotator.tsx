// Replace the entire component with this simplified version that displays the PDF the same way as the viewer

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
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PdfAnnotatorProps {
  url: string | null;
  onSave?: (annotatedPdfBlob: Blob) => Promise<void>;
  version?: string;
}

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

export function PdfAnnotator({
  url,
  onSave,
  version = "1.0",
}: PdfAnnotatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
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
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  // Initialize the canvas overlay when the component mounts
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const resizeCanvas = () => {
      if (!containerRef.current || !canvasRef.current || !iframeRef.current)
        return;

      const iframe = iframeRef.current;
      const canvas = canvasRef.current;

      // Set canvas dimensions to match the iframe
      const rect = iframe.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Position canvas over iframe
      canvas.style.position = "absolute";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.pointerEvents = "auto"; // Allow interaction with canvas

      // Redraw annotations
      drawAnnotations(currentPage);
    };

    useEffect(() => {
      if (url) {
        setIsLoading(false);
      }
    }, [url]);

    // Set a reasonable number of pages (in a real app, you'd get this from the PDF)
    setTotalPages(5);

    // Handle window resize
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [url]); // Add url as a dependency

  // Update canvas when current page changes
  useEffect(() => {
    drawAnnotations(currentPage);
  }, [currentPage]);

  const drawAnnotations = (pageNumber: number) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    // Clear canvas (make it transparent)
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Filter annotations for the current page
    const pageAnnotations = annotations.filter(
      (anno) => anno.pageNumber === pageNumber,
    );

    // Draw each annotation
    pageAnnotations.forEach((annotation) => {
      context.strokeStyle = annotation.color;
      context.fillStyle = annotation.color;
      context.lineWidth = annotation.lineWidth || 2;

      switch (annotation.type) {
        case "pen":
          if (annotation.points && annotation.points.length > 1) {
            context.beginPath();
            context.moveTo(annotation.points[0].x, annotation.points[0].y);
            for (let i = 1; i < annotation.points.length; i++) {
              context.lineTo(annotation.points[i].x, annotation.points[i].y);
            }
            context.stroke();
          }
          break;

        case "highlighter":
          if (annotation.points && annotation.points.length > 1) {
            context.globalAlpha = 0.3;
            context.beginPath();
            context.moveTo(annotation.points[0].x, annotation.points[0].y);
            for (let i = 1; i < annotation.points.length; i++) {
              context.lineTo(annotation.points[i].x, annotation.points[i].y);
            }
            context.stroke();
            context.globalAlpha = 1.0;
          }
          break;

        case "text":
          if (
            annotation.text &&
            annotation.points &&
            annotation.points.length > 0
          ) {
            const point = annotation.points[0];
            context.font = "16px Arial";
            context.fillText(annotation.text, point.x, point.y);
          }
          break;

        case "rectangle":
          if (annotation.rect) {
            const { x, y, width, height } = annotation.rect;
            context.strokeRect(x, y, width, height);
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
            context.translate(point.x, point.y);
            context.rotate(-Math.PI / 8); // Rotate slightly
            context.font = "bold 24px Arial";
            context.strokeStyle = annotation.color;
            context.lineWidth = 2;
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
              context.drawImage(img, point.x, point.y, 200, 100);
            };
            img.src = signatureDataUrl;
          }
          break;
      }
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || isLoading) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);

    // Create a new annotation based on the selected tool
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: tool,
      color,
      lineWidth,
      pageNumber: currentPage,
      version,
      author: "Current User", // Replace with actual user info
      timestamp: new Date().toISOString(),
    };

    switch (tool) {
      case "pen":
      case "highlighter":
        newAnnotation.points = [{ x, y }];
        break;

      case "text":
        setShowTextInput(true);
        setTextPosition({ x, y });
        newAnnotation.points = [{ x, y }];
        break;

      case "rectangle":
        newAnnotation.rect = { x, y, width: 0, height: 0 };
        break;

      case "stamp":
        newAnnotation.points = [{ x, y }];
        newAnnotation.text = stampText;
        break;

      case "signature":
        if (signatureDataUrl) {
          newAnnotation.points = [{ x, y }];
        } else {
          setIsSignatureModalOpen(true);
          setIsDrawing(false);
          return;
        }
        break;

      case "eraser":
        // Find and remove annotations near this point
        const annotationsToKeep = annotations.filter((anno) => {
          if (anno.pageNumber !== currentPage) return true;

          if (anno.points && anno.points.length > 0) {
            // Check if any point is close to the eraser
            return !anno.points.some(
              (point) =>
                Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)) <
                10,
            );
          }

          if (anno.rect) {
            // Check if the eraser is inside the rectangle
            const { x: rx, y: ry, width, height } = anno.rect;
            return !(x >= rx && x <= rx + width && y >= ry && y <= ry + height);
          }

          return true;
        });

        if (annotationsToKeep.length < annotations.length) {
          setUndoStack([...undoStack, annotations]);
          setRedoStack([]);
          setAnnotations(annotationsToKeep);
        }

        setIsDrawing(false);
        return;

      case "hand":
        // Hand tool for panning - not implemented in this example
        setIsDrawing(false);
        return;
    }

    setCurrentAnnotation(newAnnotation);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const updatedAnnotation = { ...currentAnnotation };

    switch (currentAnnotation.type) {
      case "pen":
      case "highlighter":
        updatedAnnotation.points = [
          ...(updatedAnnotation.points || []),
          { x, y },
        ];
        break;

      case "rectangle":
        if (updatedAnnotation.rect) {
          const startX = updatedAnnotation.rect.x;
          const startY = updatedAnnotation.rect.y;
          updatedAnnotation.rect = {
            x: Math.min(startX, x),
            y: Math.min(startY, y),
            width: Math.abs(x - startX),
            height: Math.abs(y - startY),
          };
        }
        break;
    }

    setCurrentAnnotation(updatedAnnotation);

    // Draw the current annotation
    const context = canvas.getContext("2d");
    if (!context) return;

    // Clear canvas and redraw all annotations
    drawAnnotations(currentPage);

    // Draw the current annotation
    context.strokeStyle = updatedAnnotation.color;
    context.fillStyle = updatedAnnotation.color;
    context.lineWidth = updatedAnnotation.lineWidth || 2;

    switch (updatedAnnotation.type) {
      case "pen":
        if (updatedAnnotation.points && updatedAnnotation.points.length > 1) {
          context.beginPath();
          context.moveTo(
            updatedAnnotation.points[0].x,
            updatedAnnotation.points[0].y,
          );
          for (let i = 1; i < updatedAnnotation.points.length; i++) {
            context.lineTo(
              updatedAnnotation.points[i].x,
              updatedAnnotation.points[i].y,
            );
          }
          context.stroke();
        }
        break;

      case "highlighter":
        if (updatedAnnotation.points && updatedAnnotation.points.length > 1) {
          context.globalAlpha = 0.3;
          context.beginPath();
          context.moveTo(
            updatedAnnotation.points[0].x,
            updatedAnnotation.points[0].y,
          );
          for (let i = 1; i < updatedAnnotation.points.length; i++) {
            context.lineTo(
              updatedAnnotation.points[i].x,
              updatedAnnotation.points[i].y,
            );
          }
          context.stroke();
          context.globalAlpha = 1.0;
        }
        break;

      case "rectangle":
        if (updatedAnnotation.rect) {
          const { x, y, width, height } = updatedAnnotation.rect;
          context.strokeRect(x, y, width, height);
        }
        break;
    }
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
        await onSave(blob);
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
        description: "Annotations saved successfully",
      });
    } catch (error) {
      console.error("Error saving annotations:", error);
      toast({
        title: "Error",
        description: "Failed to save annotations",
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

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);

      // In a real implementation, you would navigate the PDF to the previous page
      if (iframeRef.current) {
        // This is a simplified approach - in a real app you'd use PDF.js API
        // to navigate pages
      }
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);

      // In a real implementation, you would navigate the PDF to the next page
      if (iframeRef.current) {
        // This is a simplified approach - in a real app you'd use PDF.js API
        // to navigate pages
      }
    }
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
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-muted/20 border-b">
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

        <div className="flex items-center space-x-1">
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

        <div className="flex items-center space-x-1">
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

          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            -
          </Button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            +
          </Button>
        </div>
      </div>

      {/* Page navigation */}
      <div className="flex items-center justify-center p-2 bg-muted/10">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
        >
          Previous
        </Button>
        <span className="mx-4 text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>

      {/* PDF viewer with annotation overlay */}
      <div className="flex-1 overflow-auto p-4 flex justify-center bg-muted/20">
        {isLoading ? (
          <Skeleton className="h-[500px] w-full max-w-3xl rounded-lg" />
        ) : (
          <div
            className="relative border rounded-lg shadow-sm"
            style={{ width: "100%", maxWidth: "800px", height: "600px" }}
          >
            {/* PDF iframe - ensure it has the right parameters to display */}
            <iframe
              ref={iframeRef}
              src={`${url}#toolbar=0&view=FitH`}
              className="w-full h-full"
              style={{ border: "none" }}
              onLoad={() => setIsLoading(false)}
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
        )}
      </div>

      {/* Text annotation input */}
      {showTextInput && (
        <div
          className="absolute bg-white p-4 border shadow-md rounded-md"
          style={{
            left: textPosition.x,
            top: textPosition.y,
            transform: "translate(20px, 20px)",
            zIndex: 50,
          }}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="textAnnotation">Text</Label>
              <Textarea
                id="textAnnotation"
                value={textAnnotation}
                onChange={(e) => setTextAnnotation(e.target.value)}
                autoFocus
              />
            </div>
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
          <div className="bg-white p-6 rounded-lg shadow-lg w-[500px]">
            <h3 className="text-lg font-medium mb-4">Create Signature</h3>
            <div className="border rounded-md p-2 mb-4">
              <canvas
                ref={signatureCanvasRef}
                width={450}
                height={200}
                className="border"
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
    </div>
  );
}
