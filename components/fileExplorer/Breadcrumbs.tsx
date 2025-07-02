"use client";

import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Folder } from "lucide-react";
import type { FileNode } from "@/types/file";

interface BreadcrumbsProps {
  currentPath: FileNode[];
  onBreadcrumbClick: (index: number) => void;
}

export function Breadcrumbs({
  currentPath,
  onBreadcrumbClick,
}: BreadcrumbsProps) {
  return (
    <div className="p-2 bg-white rounded-md">
      <Breadcrumb>
        <BreadcrumbList className="gap-2">
          {currentPath.map((crumb, index) => {
            const isLast = index === currentPath.length - 1;

            return (
              <div key={crumb.id} className="flex items-center gap-2">
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="flex items-center gap-2">
                      {index === 0 && <Folder className="h-4 w-4" />}
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-auto p-1 px-2 font-medium"
                        onClick={() => onBreadcrumbClick(index)}
                      >
                        {crumb.label}
                      </Button>
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 px-2 text-muted-foreground hover:text-foreground"
                        onClick={() => onBreadcrumbClick(index)}
                      >
                        <span className="flex items-center gap-2">
                          {index === 0 && <Folder className="h-4 w-4" />}
                          {crumb.label}
                        </span>
                      </Button>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </div>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
