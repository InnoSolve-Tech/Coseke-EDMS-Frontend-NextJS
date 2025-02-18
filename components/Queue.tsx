import type React from "react";
import { Button } from "@/components/ui/button";
import { FileText, X } from "lucide-react";

interface QueueProps {
  items: { file: File; documentType: string; metadata: Record<string, any> }[];
  onRemove: (index: number) => void;
}

const Queue: React.FC<QueueProps> = ({ items, onRemove }) => {
  return (
    <div className="mt-4 border border-gray-200 rounded-md p-4">
      <h3 className="text-lg font-semibold mb-2">Queued Files</h3>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
          >
            <div className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              <span>
                {item.file.name} - {item.documentType}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onRemove(index)}>
              <X className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};
