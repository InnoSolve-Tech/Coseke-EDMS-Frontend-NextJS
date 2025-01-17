"use client";

import { Pie, PieChart, ResponsiveContainer, Cell, Legend } from "recharts";
import { useEffect, useState } from "react";
import { getAllFiles } from "@/components/files/api";

interface FileData {
  mimeType?: string;
}

interface ApiResponse<T> {
  data: T;
  status?: number;
  message?: string;
}

// Define literal types for file types
type FileType =
  | "PDF"
  | "DOCX"
  | "DOC"
  | "XLSX"
  | "XLS"
  | "PPTX"
  | "PPT"
  | "TXT"
  | "JPG"
  | "PNG"
  | "TIFF"
  | "Others";

// EDMS-specific colors with good contrast
const COLORS = [
  "#2563EB", // Blue
  "#DC2626", // Red
  "#059669", // Green
  "#D97706", // Amber
  "#7C3AED", // Purple
  "#DB2777", // Pink
  "#2563EB", // Blue
  "#EA580C", // Orange
];

// EDMS-specific MIME types
const mimeTypeToType: Record<string, FileType> = {
  // Documents
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "PPTX",
  "application/vnd.ms-powerpoint": "PPT",
  "text/plain": "TXT",

  // Images
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/tiff": "TIFF",

  // Others
  default: "Others",
};

// Group types for legend organization with proper typing
const typeGroups: Record<string, readonly FileType[]> = {
  "Microsoft Office": ["DOC", "DOCX", "XLS", "XLSX", "PPT", "PPTX"],
  "Standard Formats": ["PDF", "TXT"],
  Images: ["JPG", "PNG", "TIFF"],
  Other: ["Others"],
} as const;

interface ChartDataItem {
  name: FileType;
  value: number;
}

export function FileTypeChart() {
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const processFileTypeDistribution = (files: FileData[]): ChartDataItem[] => {
    // Initialize with all possible file types set to 0
    const distribution: Record<FileType, number> = Object.values(
      mimeTypeToType,
    ).reduce(
      (acc, type) => ({ ...acc, [type]: 0 }),
      {} as Record<FileType, number>,
    );

    // Count actual files
    files.forEach((file) => {
      const mimeType = file.mimeType || "unknown";
      const fileType = mimeTypeToType[mimeType] || mimeTypeToType.default;
      distribution[fileType] = (distribution[fileType] || 0) + 1;
    });

    // Convert to array format and sort by groups then by value
    return Object.entries(distribution)
      .map(([name, value]) => ({ name: name as FileType, value }))
      .sort((a, b) => {
        // First sort by value (descending)
        if (b.value !== a.value) {
          return b.value - a.value;
        }
        // Then by group order
        const getGroupForType = (type: FileType): string => {
          for (const [group, types] of Object.entries(typeGroups)) {
            if (types.includes(type)) {
              return group;
            }
          }
          return "Other";
        };
        return getGroupForType(a.name).localeCompare(getGroupForType(b.name));
      });
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
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading document statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4 rounded-lg bg-red-50">
        {error}
      </div>
    );
  }

  const hasData = chartData.some((item) => item.value > 0);

  if (!hasData) {
    return (
      <div className="text-gray-500 text-center p-4">No documents found</div>
    );
  }

  return (
    <div className="w-full">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData.filter((item) => item.value > 0)}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData
                .filter((item) => item.value > 0)
                .map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 space-y-6 px-4">
        {Object.entries(typeGroups).map(([groupName, types]) => {
          const groupItems = chartData.filter((item) =>
            types.includes(item.name),
          );
          if (groupItems.length === 0) return null;

          return (
            <div key={groupName} className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">{groupName}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {groupItems.map((item, index) => (
                  <div
                    key={item.name}
                    className={`flex items-center gap-2 ${
                      item.value === 0 ? "opacity-50" : ""
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          item.value > 0
                            ? COLORS[index % COLORS.length]
                            : "#D1D5DB",
                      }}
                    />
                    <span className="text-sm whitespace-nowrap">
                      {item.name} ({item.value})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
