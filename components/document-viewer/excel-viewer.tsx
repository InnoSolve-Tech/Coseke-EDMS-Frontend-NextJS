"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface ExcelViewerProps {
  url: string;
}

export function ExcelViewer({ url }: ExcelViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [excelData, setExcelData] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!url) {
      toast({
        title: "No document",
        description: "No Excel document provided.",
        variant: "destructive",
      });
      return;
    }

    const loadExcelFile = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        setExcelData(data as any[]);
      } catch (err) {
        console.error("Error loading Excel file:", err);
        setError("Failed to load Excel file");
        toast({
          title: "Error",
          description: "Failed to load Excel file",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadExcelFile();
  }, [url, toast]);

  if (isLoading) {
    return <Skeleton className="h-[500px] w-full rounded-lg" />;
  }

  if (error) {
    return <p className="text-red-500 text-center p-4">{error}</p>;
  }

  if (!excelData || excelData.length === 0) {
    return <p className="text-gray-500 text-center p-4">No data available</p>;
  }

  return (
    <div className="p-4 min-h-[500px] bg-white overflow-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            {(excelData[0] as any[]).map((cell, index) => (
              <th
                key={index}
                className="border border-gray-300 px-4 py-2 text-left"
              >
                {cell || `Column ${index + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {excelData.slice(1).map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={rowIndex % 2 === 0 ? "bg-gray-50" : ""}
            >
              {(row as any[]).map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="border border-gray-300 px-4 py-2"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
