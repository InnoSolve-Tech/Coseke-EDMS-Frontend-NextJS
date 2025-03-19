"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FilePenLine, Upload, X } from "lucide-react";

interface DigitalSignatureProps {
  onSignatureCreated: (signatureDataUrl: string) => void;
}

export function DigitalSignature({
  onSignatureCreated,
}: DigitalSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureType, setSignatureType] = useState<
    "draw" | "type" | "upload"
  >("draw");
  const [typedSignature, setTypedSignature] = useState("");
  const [signatureFont, setSignatureFont] = useState(
    "'Dancing Script', cursive",
  );
  const { toast } = useToast();

  // Load the signature font
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.lineTo(x, y);
    context.stroke();
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    if (signatureType === "type" && typedSignature.trim()) {
      const context = canvas.getContext("2d");
      if (!context) return;

      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Draw typed signature
      context.font = `32px ${signatureFont}`;
      context.fillStyle = "#000000";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(typedSignature, canvas.width / 2, canvas.height / 2);
    }

    const dataUrl = canvas.toDataURL("image/png");

    // Check if the signature is empty (all white)
    if (isCanvasBlank(canvas)) {
      toast({
        title: "Error",
        description: "Please create a signature first",
        variant: "destructive",
      });
      return;
    }

    onSignatureCreated(dataUrl);

    toast({
      title: "Success",
      description: "Signature saved successfully",
    });
  };

  const isCanvasBlank = (canvas: HTMLCanvasElement): boolean => {
    const context = canvas.getContext("2d");
    if (!context) return true;

    const pixelBuffer = new Uint32Array(
      context.getImageData(0, 0, canvas.width, canvas.height).data.buffer,
    );

    return !pixelBuffer.some((color) => color !== 0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvasRef.current) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate dimensions to fit the image while maintaining aspect ratio
        const scale = Math.min(
          canvas.width / img.width,
          canvas.height / img.height,
        );

        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;

        // Draw the image
        context.drawImage(
          img,
          0,
          0,
          img.width,
          img.height,
          x,
          y,
          img.width * scale,
          img.height * scale,
        );
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Button
          variant={signatureType === "draw" ? "default" : "outline"}
          onClick={() => setSignatureType("draw")}
        >
          <FilePenLine className="h-4 w-4 mr-2" />
          Draw
        </Button>
        <Button
          variant={signatureType === "type" ? "default" : "outline"}
          onClick={() => setSignatureType("type")}
        >
          Type
        </Button>
        <Button
          variant={signatureType === "upload" ? "default" : "outline"}
          onClick={() => setSignatureType("upload")}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
      </div>

      {signatureType === "type" && (
        <div className="space-y-2">
          <Label htmlFor="typedSignature">Type your signature</Label>
          <Input
            id="typedSignature"
            value={typedSignature}
            onChange={(e) => setTypedSignature(e.target.value)}
            placeholder="Your signature"
          />
        </div>
      )}

      {signatureType === "upload" && (
        <div className="space-y-2">
          <Label htmlFor="signatureUpload">Upload signature image</Label>
          <Input
            id="signatureUpload"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
          />
        </div>
      )}

      <div className="border rounded-md p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          className="border w-full cursor-crosshair bg-white"
          onMouseDown={signatureType === "draw" ? handleMouseDown : undefined}
          onMouseMove={signatureType === "draw" ? handleMouseMove : undefined}
          onMouseUp={signatureType === "draw" ? handleMouseUp : undefined}
          onMouseLeave={signatureType === "draw" ? handleMouseUp : undefined}
        />
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleClear}>
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
        <Button onClick={handleSave}>Save Signature</Button>
      </div>
    </div>
  );
}
