"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!url) {
      toast({
        title: "No document",
        description: "No PDF document provided.",
        variant: "destructive",
      });
    }
  }, [url, toast]);

  return (
    <div className="flex justify-center p-4 min-h-[500px] bg-muted/20">
      {isLoading && (
        <Skeleton className="h-[500px] w-full max-w-3xl rounded-lg" />
      )}
      {url ? (
        <iframe
          src={`${url}#toolbar=0&zoom=100`}
          width="100%"
          height="600px"
          onLoad={() => setIsLoading(false)}
          className="border rounded-lg"
        />
      ) : (
        <p className="text-gray-500 text-center">No PDF file available</p>
      )}
    </div>
  );
}
