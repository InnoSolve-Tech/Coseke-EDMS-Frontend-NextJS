"use client";

import { Pie, PieChart, ResponsiveContainer, Cell, Legend } from "recharts";
import { useEffect, useState } from "react";
import { getAllFiles } from "@/components/files/api";
import { FileText, FileImage, FileSpreadsheet } from "lucide-react";

interface FileData {
  mimeType?: string;
}

type FileType = "PDF" | "DOCX" | "XLSX" | "Images" | "Others";

const COLORS = {
  PDF: "#DC2626",
  DOCX: "#2563EB",
  XLSX: "#059669",
  Images: "#D97706",
  Others: "#7C3AED",
};

const FILE_ICONS = {
  PDF: FileText,
  DOCX: FileText,
  XLSX: FileSpreadsheet,
  Images: FileImage,
  Others: FileText,
};

const mimeTypeToType: Record<string, FileType> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "image/jpeg": "Images",
  "image/png": "Images",
  "image/tiff": "Images",
  default: "Others",
};

interface ChartDataItem {
  name: FileType;
  value: number;
  color: string;
  Icon: typeof FileText;
}

export function FileTypeChart() {
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const processFileTypeDistribution = (files: FileData[]): ChartDataItem[] => {
    const distribution: Record<FileType, number> = {
      PDF: 0,
      DOCX: 0,
      XLSX: 0,
      Images: 0,
      Others: 0,
    };

    files.forEach((file) => {
      const mimeType = file.mimeType || "unknown";
      const fileType = mimeTypeToType[mimeType] || mimeTypeToType.default;
      distribution[fileType] = (distribution[fileType] || 0) + 1;
    });

    return Object.entries(distribution)
      .map(([name, value]) => ({
        name: name as FileType,
        value,
        color: COLORS[name as FileType],
        Icon: FILE_ICONS[name as FileType],
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getAllFiles();
        let fileData: FileData[];

        if (Array.isArray(response)) {
          fileData = response;
        } else if (response.data && Array.isArray(response.data)) {
          fileData = response.data;
        } else {
          throw new Error("Invalid response format");
        }

        const processedData = processFileTypeDistribution(fileData);
        setChartData(processedData);
      } catch (err) {
        console.error("Error loading chart data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load chart data",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="text-gray-600">Loading document statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-3 rounded-lg bg-red-50">
        {error}
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="text-gray-500 text-center p-3">No documents found</div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 px-2">
        <div className="grid grid-cols-2 gap-3">
          {chartData.map((item) => {
            const IconComponent = item.Icon;
            return (
              <div key={item.name} className="flex items-center gap-2">
                <IconComponent
                  className="h-4 w-4"
                  style={{ color: item.color }}
                />
                <span className="text-sm whitespace-nowrap">
                  {item.name} ({item.value})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
