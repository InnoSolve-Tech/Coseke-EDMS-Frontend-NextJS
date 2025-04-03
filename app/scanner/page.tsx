"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import "./scanner.css";

export default function ScannerPage() {
  const [isDynamicComponentLoaded, setIsDynamicComponentLoaded] =
    useState(false);
  const [DynamicDWT, setDynamicDWT] = useState<React.ComponentType<any> | null>(
    null,
  );

  useEffect(() => {
    // Dynamically import the component to avoid issues during build time
    const loadDynamicComponent = async () => {
      try {
        const DWTModule = await import("@/components/DynamsoftSDK");
        setDynamicDWT(() => DWTModule.default);
        setIsDynamicComponentLoaded(true);
      } catch (error) {
        console.error("Failed to load DWT component:", error);
      }
    };

    loadDynamicComponent();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main Content */}
      <main className="flex-1 p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">
            Document Scanner
          </h1>

          {isDynamicComponentLoaded && DynamicDWT ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <DynamicDWT
                features={[
                  "scan",
                  "camera",
                  "load",
                  "save",
                  "upload",
                  "barcode",
                  "uploader",
                ]}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow-md p-12">
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-600 text-lg">
                Loading scanner component...
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-4 px-6 text-center text-gray-600 text-sm">
        <p>Powered by Coseke Document Scanning Technology</p>
      </footer>
    </div>
  );
}
