"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Folder, GitBranch, CheckSquare } from "lucide-react";
import { UsageChart } from "@/components/UsageChart";
import { FileTypeChart } from "@/components/FileTypeChart";
import { WorkflowStatusChart } from "@/components/WorkflowStatusChart";
import { RecentActivities } from "@/components/RecentActivities";
import { RecentFilesCard } from "@/components/RecentFilesCard";
import { getAllFiles, getFiles, getFolders } from "@/components/files/api"; // Assuming this API is available

export default function Page() {
  const [fileCount, setFileCount] = useState<string>("...");
  const [folderCount, setFolderCount] = useState<string>("...");

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
  }, []);

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
          value="56"
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
            <WorkflowStatusChart />
          </CardContent>
        </Card>
        <RecentFilesCard />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivities />
        </CardContent>
      </Card>
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
