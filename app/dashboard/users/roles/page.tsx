"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SystemRoles } from "@/components/roles/system-roles";
import { Departments } from "@/components/roles/departments";

export default function RolesAndPermissions() {
  const [activeTab, setActiveTab] = useState("system-roles");

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Roles and Permissions</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="system-roles">System Roles</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>
        <TabsContent value="system-roles">
          <SystemRoles />
        </TabsContent>
        <TabsContent value="departments">
          <Departments />
        </TabsContent>
      </Tabs>
    </div>
  );
}
