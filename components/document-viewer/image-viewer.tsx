"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageViewerProps {
  url: string;
  alt?: string;
}

export function ImageViewer({ url, alt = "Document image" }: ImageViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return (
    <div className="flex flex-col items-center p-4 min-h-[500px] bg-muted/20">
      <div className="flex justify-center space-x-2 mb-4">
        <Button variant="outline" size="sm" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4 mr-1" /> Zoom In
        </Button>
        <Button variant="outline" size="sm" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4 mr-1" /> Zoom Out
        </Button>
        <Button variant="outline" size="sm" onClick={handleRotate}>
          <RotateCw className="h-4 w-4 mr-1" /> Rotate
        </Button>
      </div>

      <div className="relative w-full h-[500px] flex items-center justify-center overflow-hidden">
        {isLoading && (
          <Skeleton className="h-[500px] w-full max-w-3xl rounded-lg absolute" />
        )}
        {url ? (
          <img
            src={url || "/placeholder.svg"}
            alt={alt}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: "transform 0.2s ease-in-out",
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
            onLoad={() => setIsLoading(false)}
            className="max-w-full max-h-full"
          />
        ) : (
          <p className="text-gray-500 text-center">No image available</p>
        )}
      </div>
    </div>
  );
}
