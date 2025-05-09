"use client";

import type React from "react";
import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import "./scanner.css";

export default function ScannerPage() {
  const [isDynamicComponentLoaded, setIsDynamicComponentLoaded] =
    useState(false);
  const [DynamicDWT, setDynamicDWT] = useState<React.ComponentType<any> | null>(
    null,
  );
  const componentMounted = useRef(false);

  // Function to load the dynamic component
  const loadDynamicComponent = async () => {
    try {
      // Only load if not already loaded
      if (!componentMounted.current) {
        setDynamicDWT(null);
        setIsDynamicComponentLoaded(false);

        // Import the module
        const DWTModule = await import("@/components/DynamsoftSDK");
        setDynamicDWT(() => DWTModule.default);
        setIsDynamicComponentLoaded(true);
        componentMounted.current = true;
      }
    } catch (error) {
      console.error("Failed to load DWT component:", error);
    }
  };

  useEffect(() => {
    // Initial load only
    loadDynamicComponent();

    // Cleanup function
    return () => {
      // Only reset the mounted flag when the component is fully unmounted
      // Not when the page is just hidden
      componentMounted.current = false;
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main Content */}
      <main className="flex-1 p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">
            Document Scanner
          </h1>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {isDynamicComponentLoaded && DynamicDWT ? (
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
            ) : (
              <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-600 text-lg">
                  Loading scanner component...
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-4 px-6 text-center text-gray-600 text-sm">
        <p>Powered by Coseke Document Scanning Technology</p>
      </footer>
    </div>
  );
}
