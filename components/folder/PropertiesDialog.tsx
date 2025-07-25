"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Edit3,
  Save,
  Calendar,
  Folder,
  FileText,
  Clock,
  Shield,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getFolders } from "@/core/files/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { DirectoryData } from "./FileUploadDialog";
import { getAllRoles } from "@/core/authentication/api";
import { Role } from "@/lib/types/user";
import { AccessType, updateDirectory } from "./api";

interface PropertiesDialogProps {
  open: boolean;
  onClose: () => void;
  folderID: number;
}

export default function PropertiesDialog({
  open,
  onClose,
  folderID,
}: PropertiesDialogProps) {
  const [folder, setFolder] = useState<DirectoryData>();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [viewingPermission, setViewingPermission] =
    useState<AccessType>();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    (async() => {
      let res = await getAllRoles();
      setRoles(res);
    })();
  }, []);

  useEffect(() => {
    const fetchFolderData = async () => {
      if (folderID) {
        setLoading(true);
        try {
          const res: any = await getFolders();
          const data: any = res.find((f: any) => f.folderID == folderID);
          console.log("Fetched folder data:", data);
          setFolder(data);
          setEditedName(data?.name || "");
          setViewingPermission(data?.accessControl?.accessType);
          setSelectedRoles(
            data?.accessControl?.roles?.map((role: number) => role.toString()) || [],
          );
        } catch (error) {
          console.error("Error fetching folder data:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchFolderData();
  }, [folderID]);

  const handleSave = async () => {
    try {
      setIsEditing(false);
      const updatedFolder: DirectoryData = {
        folderID:folderID,
        name: editedName,
        parentFolderID: folder!.parentFolderID,
        accessControl:{
        id: folder!.accessControl ? folder!.accessControl.id : undefined,
        roles: selectedRoles.map((id) => parseInt(id)),
        accessType: viewingPermission!,
      }}
      await updateDirectory(updatedFolder);
      setFolder(undefined);
      onClose();
    } catch (error) {
      console.error("Error saving folder:", error);
    }
  };

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSelectedRoleNames = () => {
    return roles
      .filter((role) => selectedRoles.includes(role.id?.toString() || ""))
      .map((role) => role.name);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Folder className="h-5 w-5 text-blue-600" />
            Folder Properties
            {isEditing && (
              <Badge variant="outline" className="ml-2">
                <Edit3 className="h-3 w-3 mr-1" />
                Editing
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Folder Information
            </h3>
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              disabled={loading}
            >
              {isEditing ? (
                <>
                  <Save className="h-3 w-3 mr-1" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit3 className="h-3 w-3 mr-1" />
                  Edit
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-6 h-full">
            {/* Left Column */}
            <ScrollArea className="max-h-[calc(95vh-200px)]">
              <div className="space-y-6 pr-4">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label
                        htmlFor="folder-name"
                        className="text-xs font-medium"
                      >
                        Folder Name
                      </Label>
                      {isEditing ? (
                        <Input
                          id="folder-name"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded">
                          {folder?.name || "N/A"}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Folder ID</Label>
                      <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded">
                        {folder?.folderID || "N/A"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Access Control */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="h-3 w-3" />
                      Access Control
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label
                        htmlFor="viewing-permission"
                        className="text-xs font-medium"
                      >
                        Viewing Permission
                      </Label>
                      {isEditing ? (
                        <Select
                          value={viewingPermission}
                          onValueChange={(value: AccessType) =>
                            setViewingPermission(value)
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={AccessType.PUBLIC}>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Public - Anyone can view
                              </div>
                            </SelectItem>
                            <SelectItem value={AccessType.MODERATED}>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                Moderated - Selected roles can view
                              </div>
                            </SelectItem>
                            <SelectItem value={AccessType.PRIVATE}>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                Private - Selected roles can view
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1 p-2 bg-gray-50 rounded flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              viewingPermission === AccessType.PUBLIC
                                ? "bg-green-500"
                                : viewingPermission === AccessType.MODERATED
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                          ></div>
                          <span className="text-sm text-gray-900 capitalize">
                            {viewingPermission}
                          </span>
                        </div>
                      )}
                    </div>
                    {(viewingPermission === AccessType.MODERATED ||
                      viewingPermission === AccessType.PRIVATE) && (
                      <div>
                        <Label className="text-xs font-medium flex items-center gap-2 mb-3">
                          <Users className="h-3 w-3" />
                          Roles with Access
                          {!isEditing && (
                            <Badge variant="secondary" className="ml-2">
                              {selectedRoles.length} selected
                            </Badge>
                          )}
                        </Label>

                        {isEditing ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                            {roles.map((role) => (
                              <div
                                key={role.id}
                                className="flex items-start space-x-3"
                              >
                                <Checkbox
                                  id={`role-${role.id}`}
                                  checked={selectedRoles.includes(role.id?.toString() || "")}
                                  onCheckedChange={() =>
                                    handleRoleToggle(role.id?.toString() || "")
                                  }
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <Label
                                    htmlFor={`role-${role.id}`}
                                    className="text-sm font-medium cursor-pointer"
                                  >
                                    {role.name}
                                  </Label>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {getSelectedRoleNames().map((roleName) => (
                              <Badge key={roleName} variant="outline">
                                {roleName}
                              </Badge>
                            ))}
                            {selectedRoles.length === 0 && (
                              <span className="text-sm text-gray-500 italic">
                                No roles selected
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>

            {/* Right Column */}
            <ScrollArea className="max-h-[calc(95vh-200px)]">
              <div className="space-y-6 pr-4">
                {/* Timestamps */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      Timestamps
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Created Date
                      </Label>
                      <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded">
                        {folder?.createdDate
                          ? formatDate(folder.createdDate)
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last Modified
                      </Label>
                      <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded">
                        {folder?.lastModifiedDateTime
                          ? formatDate(folder.lastModifiedDateTime)
                          : "N/A"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Files Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      Files Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium">Total Files</Label>
                      <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded">
                        {folder?.files?.length || 0}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">
                        Parent Folder ID
                      </Label>
                      <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded">
                        {folder?.parentFolderID || "Root"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex justify-between items-center w-full">
            <div className="text-sm text-gray-500">
              {(viewingPermission === AccessType.MODERATED ||
                viewingPermission === AccessType.PRIVATE) && (
                <span>{selectedRoles.length} roles selected for access</span>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedName(folder?.name || "");
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button variant="secondary" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
