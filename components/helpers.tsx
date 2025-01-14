"use client";

import { User } from "@/lib/types/user";

export const metadataSplitter = (array: any[]) => {
  const length = array.length;
  const middleIndex = Math.ceil(length / 2);

  const firstPart = array.slice(0, middleIndex);
  const secondPart = array.slice(middleIndex);

  return [firstPart, secondPart];
};

export const createObjectFromMeta = (metaArray: any[]) => {
  return metaArray.reduce((acc, item) => {
    acc[item.name] = ""; // Set the default value to an empty string
    return acc;
  }, {});
};

export const joinStrings = (str: string): string => {
  return str
    ?.split(" ")
    .map((s) => s.toLocaleUpperCase())
    .join("_");
};

export const displayRole = (str: string): string => {
  return str
    ?.split("_")
    .map((str) => str.toLocaleLowerCase())
    .join(" ");
};

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunkSize = 1024 * 1024; // 1MB chunks
    let offset = 0;
    const reader = new FileReader();
    let byteArray: number[] = [];

    reader.onload = () => {
      if (reader.result) {
        const buffer = new Uint8Array(reader.result as ArrayBuffer);
        byteArray = byteArray.concat(Array.from(buffer));

        // If there's more to read, continue
        if (offset < file.size) {
          readNextChunk();
        } else {
          // Convert the byte array to base64 string
          const base64String = btoa(
            byteArray.reduce(
              (data, byte) => data + String.fromCharCode(byte),
              "",
            ),
          );
          resolve(base64String);
        }
      } else {
        reject(new Error("Error converting file to Base64"));
      }
    };

    reader.onerror = (error) => reject(error);

    const readNextChunk = () => {
      const slice = file.slice(offset, offset + chunkSize);
      reader.readAsArrayBuffer(slice); // Read as ArrayBuffer to avoid data URL issues
      offset += chunkSize;
    };

    // Start reading the first chunk
    readNextChunk();
  });
}

export function base64ToFile(
  base64String: string,
  filename: string,
  mimeType: string,
): File {
  const byteCharacters = atob(base64String);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new File([byteArray], filename, { type: mimeType });
}

export const formatString = (input: string): string => {
  return input
    .toLowerCase() // Convert the entire string to lowercase
    .split("_") // Split the string into an array using underscore as delimiter
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word
    .join(" "); // Join the words with a space
};

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

export const renderFilePreview = (file: string, mimeType: string) => {
  if (!file || !mimeType) {
    console.error("Invalid file or MIME type.");
    return <p>Error: Unable to load file preview.</p>;
  }

  // Handle PDF files
  if (mimeType.startsWith("application/pdf")) {
    return (
      <iframe
        src={`data:${mimeType};base64,${file}`}
        title="PDF Viewer"
        width="100%"
        height="70%"
      />
    );
  } else if (mimeType.startsWith("image/")) {
    console.log(mimeType);
    return (
      <img
        src={`data:${mimeType};base64,${file}`}
        alt="Preview"
        style={{ width: "100%", height: "70%" }} // auto height to maintain aspect ratio
      />
    );
  } else if (mimeType.startsWith("video/")) {
    const blob = base64ToBlob(file, mimeType);
    const url = URL.createObjectURL(blob);
    return (
      <video
        src={url}
        controls
        style={{ width: "100%", height: "70%" }} // auto height to maintain aspect ratio
      />
    );
  }

  // Return null if mimeType is not handled
  return <p>Unsupported file type.</p>;
};
