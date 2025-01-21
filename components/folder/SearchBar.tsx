import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchBarProps {
  onSearch: (
    query: string,
    searchType: string,
    metadata: Record<string, string>,
  ) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("simple");
  const [metadata, setMetadata] = useState<Record<string, string>>({});

  // Debounce function to avoid too many search calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(query, searchType, metadata);
    }, 300); // Wait 300ms after last keystroke before searching

    return () => clearTimeout(timeoutId);
  }, [query, searchType, metadata, onSearch]);

  const handleMetadataChange = (key: string, value: string) => {
    setMetadata((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex gap-4 items-center">
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4"
        />
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
      </div>

      <Select value={searchType} onValueChange={setSearchType}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Search type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="simple">Simple</SelectItem>
          {/* <SelectItem value="fullText">Full Text</SelectItem>
          <SelectItem value="metadata">Metadata</SelectItem> */}
        </SelectContent>
      </Select>

      {searchType === "metadata" && (
        <>
          <Input
            type="text"
            placeholder="Author"
            value={metadata.author || ""}
            onChange={(e) => handleMetadataChange("author", e.target.value)}
            className="w-40"
          />
          <Input
            type="text"
            placeholder="Version"
            value={metadata.version || ""}
            onChange={(e) => handleMetadataChange("version", e.target.value)}
            className="w-40"
          />
        </>
      )}
    </div>
  );
}
