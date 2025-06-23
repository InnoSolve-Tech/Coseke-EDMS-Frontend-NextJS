import { useState, useEffect, useRef } from "react";

interface PdfViewerProps {
  url: string;
}

export default function PdfViewer({
  url = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
}: PdfViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfSupported, setPdfSupported] = useState(true);
  const [useEmbedFallback, setUseEmbedFallback] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    // Check if PDF viewing is supported
    const checkPdfSupport = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isChrome = userAgent.includes("chrome");
      const isSafari =
        userAgent.includes("safari") && !userAgent.includes("chrome");

      // Chrome often blocks PDF iframes, so we'll use alternative approaches
      if (isChrome) {
        setUseEmbedFallback(true);
      }
    };

    checkPdfSupport();
  }, []);

  const handleIframeLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError("Failed to load PDF in iframe");
    setUseEmbedFallback(true);
  };

  const downloadPdf = () => {
    const link = document.createElement("a");
    link.href = url;
    link.download = "document.pdf";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openPdfInNewTab = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const viewWithGoogleDocs = () => {
    const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    window.open(googleDocsUrl, "_blank", "noopener,noreferrer");
  };

  // Render error state with multiple options
  if (error && useEmbedFallback) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-8">
        <div className="text-center max-w-md">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            PDF Viewer Blocked
          </h3>

          <p className="text-sm text-gray-600 mb-6">
            Chrome has blocked the PDF viewer due to security restrictions.
            Choose an alternative viewing method below:
          </p>

          <div className="space-y-3">
            <button
              onClick={openPdfInNewTab}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Open in New Tab
            </button>

            <button
              onClick={viewWithGoogleDocs}
              className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              View with Google Docs
            </button>

            <button
              onClick={downloadPdf}
              className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 1.586V18a2 2 0 01-2 2H5a2 2 0 01-2-2v-8.414"
                />
              </svg>
              Download PDF
            </button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-yellow-800">
                  Chrome Security Notice
                </h4>
                <p className="text-xs text-yellow-700 mt-1">
                  Chrome blocks some PDF viewers for security. This is normal
                  browser behavior.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with controls */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-2">
          <svg
            className="w-6 h-6 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">PDF Viewer</h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={openPdfInNewTab}
            className="flex items-center px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            title="Open in new tab"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            New Tab
          </button>

          <button
            onClick={downloadPdf}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            title="Download PDF"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 1.586V18a2 2 0 01-2 2H5a2 2 0 01-2-2v-8.414"
              />
            </svg>
            Download
          </button>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading PDF...</span>
          </div>
        </div>
      )}

      {/* PDF Content */}
      <div className="flex-1 relative">
        {useEmbedFallback ? (
          // Try embed as fallback for Chrome
          <embed
            src={url}
            type="application/pdf"
            className="w-full h-full"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        ) : (
          // Standard iframe approach
          <iframe
            ref={iframeRef}
            src={url}
            className="w-full h-full border-0"
            title="PDF Viewer"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-scripts allow-same-origin allow-downloads"
          />
        )}

        {/* Fallback message overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
            <div className="text-center">
              <div className="animate-pulse">
                <div className="w-16 h-20 bg-gray-300 rounded-lg mx-auto mb-4"></div>
                <div className="h-2 bg-gray-300 rounded w-24 mx-auto mb-2"></div>
                <div className="h-2 bg-gray-300 rounded w-16 mx-auto"></div>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Preparing PDF viewer...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom info bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t text-xs text-gray-500">
        <span>Chrome-compatible PDF viewer</span>
        <span>Multiple fallback options available</span>
      </div>
    </div>
  );
}
