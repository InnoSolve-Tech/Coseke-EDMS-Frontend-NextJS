"use client";

import { getAllFiles, getFolders } from "@/core/files/api"; // Assuming this API is available
import { FileTypeChart } from "@/components/FileTypeChart";
import { RecentFilesCard } from "@/components/RecentFilesCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsageChart } from "@/components/UsageChart";
import { WorkflowStatusChart } from "@/components/WorkflowStatusChart";
import { getAllWorkflowInstances } from "@/core/workflowInstance/api";
import { WorkflowInstance } from "@/lib/types/workflowInstance";
import { CheckSquare, FileText, Folder, GitBranch } from "lucide-react";
import { useEffect, useState } from "react";

export default function Page() {
  const [fileCount, setFileCount] = useState<string>("...");
  const [folderCount, setFolderCount] = useState<string>("...");
  const [workflowInstances, setWorkflowInstances] = useState<
    WorkflowInstance[]
  >([]);
  const [workflowInstanceCount, setWorkflowInstanceCount] =
    useState<string>("...");

  useEffect(() => {
    const fetchFileCount = async () => {
      try {
        const filesResponse = await getAllFiles(); // Fetch all files
        const files = filesResponse || [];
        setFileCount(files.length > 0 ? files.length.toLocaleString() : "0");
      } catch (error) {
        console.error("Error fetching file data:", error);
        setFileCount("---");
      }
    };

    fetchFileCount();
  }, []);

  useEffect(() => {
    const fetchFolderCount = async () => {
      try {
        const foldersResponse = await getFolders();
        console.log("Raw response:", foldersResponse);

        const folders = Array.isArray(foldersResponse)
          ? foldersResponse
          : foldersResponse.data || [];

        console.log("Parsed folders:", folders);
        setFolderCount(folders.length > 0 ? folders.length.toString() : "0");
      } catch (error) {
        console.error("Error fetching folder data:", error);
        setFolderCount("---");
      }
    };

    fetchFolderCount();
    fetchActiveWorkflowInstanceCount();
  }, []);

  const fetchActiveWorkflowInstanceCount = async () => {
    // Fetch active workflow instances
    // Set the count to `workflowInstanceCount`
    try {
      const response = await getAllWorkflowInstances();
      setWorkflowInstanceCount(
        response
          .filter((wfl: WorkflowInstance) => wfl.status !== "Completed")
          .length.toString(),
      );
      setWorkflowInstances(response);
    } catch (error) {
      console.error("Error fetching active workflow instances:", error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<FileText className="h-8 w-8 text-blue-600" />}
          title="Total Files"
          value={fileCount}
        />
        <StatCard
          icon={<Folder className="h-8 w-8 text-green-600" />}
          title="Total Folders"
          value={folderCount}
        />
        <StatCard
          icon={<GitBranch className="h-8 w-8 text-purple-600" />}
          title="Active Workflows"
          value={workflowInstanceCount}
        />
        <StatCard
          icon={<CheckSquare className="h-8 w-8 text-yellow-600" />}
          title="Pending Tasks"
          value="89"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <UsageChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>File Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <FileTypeChart />
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Workflow Status</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkflowStatusChart workflowInstances={workflowInstances} />
          </CardContent>
        </Card>
        <RecentFilesCard />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center p-6">
        <div className="mr-4">{icon}</div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
