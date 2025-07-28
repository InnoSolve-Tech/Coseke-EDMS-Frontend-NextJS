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
  File,
  FileText,
  Clock,
  Shield,
  Users,
  Hash,
  Type,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getFilesById } from "@/core/files/api";
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
import { getAllRoles } from "@/core/authentication/api";
import { Role } from "@/lib/types/user";
import { AccessType, IAccessControl, updateFileAccess } from "./api";
import { FileData } from "@/types/file";
import { ColorPaletteProp, Snackbar } from "@mui/joy";

interface PropertiesDialogProps {
  open: boolean;
  onClose: () => void;
  fileID: number;
}

export default function FilePropertiesDialog({
  open,
  onClose,
  fileID,
}: PropertiesDialogProps) {
  const [file, setFile] = useState<FileData>();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");

  const [viewingPermission, setViewingPermission] = useState<AccessType>();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
    const [snackbar, setSnackbar] = useState<{
      open: boolean;
      color: ColorPaletteProp;
      message: string;
    }>({
      open: false,
      message: "",
      color: "success",
    });

  useEffect(() => {
    (async () => {
      let res = await getAllRoles();
      setRoles(res);
    })();
  }, []);

    const showSnackbar = (message: string, color: ColorPaletteProp) => {
      setSnackbar({ open: true, message, color });
    };

  useEffect(() => {
    const fetchFileData = async () => {
      if (fileID) {
        setLoading(true);
        
        try {
          const res: FileData = await getFilesById(fileID);
          setFile(res);
          setEditedName(res.documentName);
          setViewingPermission(res.accessControl?.accessType);
          setSelectedRoles(
            res?.accessControl?.roles?.map((role: number) => role.toString()) || []
          );
        } catch (error) {
          console.error("Error fetching file data:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchFileData();
  }, [fileID]);

  const handleSave = async () => {
    if (!file) return;
    
    try {
      setLoading(true);

      if(selectedRoles.length <= 0 && viewingPermission !== AccessType.PUBLIC) {
          showSnackbar("Atleast one role must be selected!", "danger");
          return;
      }
      
      const accessControl: IAccessControl = {
        id: file.accessControl?.id,
        roles: selectedRoles.map((id) => parseInt(id)),
        accessType: viewingPermission!,
      };
      
      await updateFileAccess(file.id, accessControl);
      
      // Update local state
      setFile({ ...file, accessControl: accessControl });
      setIsEditing(false);
      handleClose();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleClose = () => {
    setIsEditing(false);
    setEditedName(file?.documentName || "");
    setViewingPermission(file?.accessControl?.accessType);
    setSelectedRoles(
      file?.accessControl?.roles?.map((role: number) => role.toString()) || []
    );
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
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="border-b pb-4 flex-shrink-0">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <File className="h-5 w-5 text-blue-600" />
            File Properties
            {isEditing && (
              <Badge variant="outline" className="ml-2">
                <Edit3 className="h-3 w-3 mr-1" />
                Editing
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              File Information
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

          <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
            {/* Left Column */}
            <ScrollArea className="h-full">
              <div className="space-y-6 pr-4">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Basic Information</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-xs font-medium">Original Filename</Label>
                      <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded">
                        {file?.filename || file?.name || "N/A"}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-xs font-medium">Document Type</Label>
                      <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded">
                        {file?.documentType || "N/A"}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-xs font-medium">MIME Type</Label>
                      <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded">
                        {file?.mimeType || "N/A"}
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
                      <Label htmlFor="viewing-permission" className="text-xs font-medium">
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
                            {viewingPermission || "Not set"}
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
            <ScrollArea className="h-full">
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
                        {file?.createdDate ? formatDate(file.createdDate) : "N/A"}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-xs font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last Modified
                      </Label>
                      <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded">
                        {file?.lastModifiedDateTime ? formatDate(file.lastModifiedDateTime) : "N/A"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Version Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      Version Information
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium">Total Versions</Label>
                      <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded">
                        {file?.fileVersions?.length || 0}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="border-t pt-4 flex-shrink-0">
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
                    setEditedName(file?.documentName || "");
                    setViewingPermission(file?.accessControl?.accessType);
                    setSelectedRoles(
                      file?.accessControl?.roles?.map((role: number) => role.toString()) || []
                    );
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
           <Snackbar
              variant="soft"
              color={snackbar.color}
              open={snackbar.open}
              autoHideDuration={3000}
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
              {snackbar.message}
            </Snackbar>
    </Dialog>
  );
}