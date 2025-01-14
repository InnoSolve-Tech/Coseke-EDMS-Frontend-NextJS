"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateFormRecord from "@/components/forms/Active/CreateFormRecord";
import ViewFormRecords from "@/components/forms/Active/ViewFormRecord";

export default function RecordsPage() {
  const [activeTab, setActiveTab] = useState("create");

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Record</TabsTrigger>
            <TabsTrigger value="view">View Records</TabsTrigger>
          </TabsList>
          <TabsContent value="create">
            <CreateFormRecord />
          </TabsContent>
          <TabsContent value="view">
            <ViewFormRecords />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
