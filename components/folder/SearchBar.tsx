"use client";

import React, { useState } from "react";
import { Input, Select, Option, Button, Stack } from "@mui/joy";
import { Search, Clear } from "@mui/icons-material";

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

  const handleSearch = () => {
    onSearch(query, searchType, metadata);
  };

  const handleClear = () => {
    setQuery("");
    setSearchType("simple");
    setMetadata({});
    onSearch("", "simple", {});
  };

  const handleMetadataChange = (key: string, value: string) => {
    setMetadata((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Input
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        endDecorator={<Search />}
      />
      <Select
        value={searchType}
        onChange={(_, value) => setSearchType(value || "simple")}
      >
        <Option value="simple">Simple</Option>
        <Option value="fullText">Full Text</Option>
        <Option value="metadata">Metadata</Option>
      </Select>
      {searchType === "metadata" && (
        <>
          <Input
            placeholder="Author"
            value={metadata.author || ""}
            onChange={(e) => handleMetadataChange("author", e.target.value)}
          />
          <Input
            placeholder="Version"
            value={metadata.version || ""}
            onChange={(e) => handleMetadataChange("version", e.target.value)}
          />
        </>
      )}
      <Button onClick={handleSearch}>Search</Button>
      <Button
        variant="outlined"
        onClick={handleClear}
        startDecorator={<Clear />}
      >
        Clear
      </Button>
    </Stack>
  );
}
