"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { IUserDetails } from "@/core/authentication/interface";
import { getFormRecordById } from "@/core/formrecords/api";
import { getAllForms } from "@/core/forms/api";
import {
  createSignature,
  getSignatureLinkById,
  getSignatures,
} from "@/core/signature/api";
import {
  updateWorkflowInstance,
  updateWorkflowInstanceStep,
} from "@/core/workflowInstance/api";
import { useToast } from "@/hooks/use-toast";
import { FormRecord } from "@/lib/types/formRecords";
import { Form } from "@/lib/types/forms";
import { Edge, WorkflowNode } from "@/lib/types/workflow";
import { WorkflowInstance } from "@/lib/types/workflowInstance";
import { CheckCircle, FileText, Pen, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getTokenFromSessionStorage,
  getUserFromSessionStorage,
} from "../routes/sessionStorage";

interface ViewFormRecordProps {
  instance: WorkflowInstance;
  forms: Form[];
  setForms: (forms: Form[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  closeDialog: () => void;
}

const ViewFormRecord = ({
  instance,
  forms,
  setForms,
  isLoading,
  setIsLoading,
  closeDialog,
}: ViewFormRecordProps) => {
  const [selectedForm, setSelectedForm] = useState<Form>();
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [nodeWithForm, setNodeWithForm] = useState<WorkflowNode>();
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [formRecordId, setFormRecordId] = useState<string>("");
  const user: IUserDetails = getUserFromSessionStorage() as IUserDetails;

  // Signature related states
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [signatureMode, setSignatureMode] = useState<
    "upload" | "draw" | "existing"
  >("upload");
  const [uploadedSignature, setUploadedSignature] = useState<string>("");
  const [drawnSignature, setDrawnSignature] = useState<string>("");
  const [existingSignatures, setExistingSignatures] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [selectedExistingSignature, setSelectedExistingSignature] =
    useState<string>("");
  const [selectedExistingSignatureId, setSelectedExistingSignatureId] =
    useState<string>("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureStatus, setSignatureStatus] = useState<
    "idle" | "signed" | "error"
  >("idle");
  const [signerName, setSignerName] = useState<string>(user?.email || "");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const router = useRouter();

  const handlerSetExistingSignatures = useCallback(
    async (signature: { id: number; name: string }) => {
      try {
        const link = await getSignatureLinkById(signature.id);

        const token = getTokenFromSessionStorage().replace(/^"|"$/g, "");

        const response = await fetch(link, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch signature blob");

        const blob = await response.blob();

        // Convert blob to Data URL (base64)
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64DataUrl = reader.result as string;
          setSelectedExistingSignature(base64DataUrl); // Used for preview or downstream processing
          setSelectedExistingSignatureId(signature.id.toString()); // Store ID for submission
        };
        reader.readAsDataURL(blob);

        return link;
      } catch (error) {
        console.error("Error fetching signature blob:", error);
        toast({
          title: "Error",
          description: "Failed to load signature.",
          variant: "destructive",
        });
        return null;
      }
    },
    [],
  );

  // Load existing signatures from localStorage or API
  const loadExistingSignatures = useCallback(async () => {
    try {
      const saved = await getSignatures();
      if (saved) {
        setExistingSignatures(saved);
      }
    } catch (error) {
      console.error("Error loading existing signatures:", error);
    }
  }, [user?.id]);

  // Save signature to localStorage or API
  const saveSignature = useCallback(
    async (name: string, file: File) => {
      try {
        const extension = file.name.split(".").pop();
        const timestamp = new Date()
          .toISOString()
          .replace(/:/g, "-") // Replace colons with hyphens
          .replace(/\./g, "-") // Replace dots in milliseconds
          .replace("T", "_") // Replace T with underscore
          .replace("Z", ""); // Remove Z if unnecessary

        const safeEmail = user.email.replace(/[@.]/g, "_"); // Replace @ and . with underscores

        const newSignature = {
          name: `${safeEmail}-${timestamp}.${extension}`,
        };

        const savedSignature = await createSignature(newSignature, file); // <-- return this

        toast({
          title: "Signature Saved",
          description: "Your signature has been saved for future use.",
        });

        return savedSignature;
      } catch (error) {
        console.error("Error saving signature:", error);
        toast({
          title: "Error",
          description: "Failed to save signature.",
          variant: "destructive",
        });
        return null;
      }
    },
    [existingSignatures, user?.id, toast],
  );

  // Handle file upload for signature
  const handleSignatureUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File",
          description: "Please upload an image file (PNG, JPG, etc.)",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setUploadedSignature(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        setDrawnSignature(canvas.toDataURL());
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setDrawnSignature("");
      }
    }
  };

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
      }
    }
  }, [signatureMode]);

  // Load existing signatures when component mounts
  useEffect(() => {
    loadExistingSignatures();
  }, []);

  // Handle signature submission
  const handleSignatureSubmit = async () => {
    let finalSignature = "";
    let signatureName = "";

    switch (signatureMode) {
      case "upload":
        if (!uploadedSignature) {
          toast({
            title: "No Signature",
            description: "Please upload a signature image.",
            variant: "destructive",
          });
          return;
        }
        finalSignature = uploadedSignature;
        signatureName = `Uploaded signature - ${new Date().toLocaleDateString()}`;
        break;

      case "draw":
        if (!drawnSignature) {
          toast({
            title: "No Signature",
            description: "Please draw your signature.",
            variant: "destructive",
          });
          return;
        }
        finalSignature = drawnSignature;
        signatureName = `Hand-drawn signature - ${new Date().toLocaleDateString()}`;
        break;

      case "existing":
        if (!selectedExistingSignatureId) {
          toast({
            title: "No Signature Selected",
            description: "Please select an existing signature.",
            variant: "destructive",
          });
          return;
        }
        break;
    }

    if (!signerName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name for the signature.",
        variant: "destructive",
      });
      return;
    }

    let signature;
    try {
      setIsLoading(true);

      // Save new signatures (upload/draw) for future use
      if (
        (signatureMode === "upload" || signatureMode === "draw") &&
        finalSignature
      ) {
        const file =
          fileInputRef.current?.files?.[0] ||
          (() => {
            // Convert data URL to File for drawn signatures
            const byteString = atob(finalSignature.split(",")[1]);
            const mimeString = finalSignature
              .split(",")[0]
              .split(":")[1]
              .split(";")[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            return new File([ab], `signature-${Date.now()}.png`, {
              type: mimeString,
            });
          })();
        const extension = file.name.split(".").pop();
        const timestamp = new Date()
          .toISOString()
          .replace(/:/g, "-") // Replace colons with hyphens
          .replace(/\./g, "-") // Replace dots in milliseconds
          .replace("T", "_") // Replace T with underscore
          .replace("Z", ""); // Remove Z if unnecessary

        const safeEmail = user.email.replace(/[@.]/g, "_"); // Replace @ and . with underscores

        const newSignature = {
          name: `${safeEmail}-${timestamp}.${extension}`,
        };
        signature = await saveSignature(newSignature.name, file);
      }

      // Update workflow instance with signature data
      if (instance.id) {
        const updatedInstance = { ...instance };
        if (!updatedInstance.metadata) updatedInstance.metadata = {};

        updatedInstance.metadata.signature = signature
          ? signature.id.toString()
          : selectedExistingSignatureId;
        updatedInstance.metadata.userId = user.id!.toString();

        await updateWorkflowInstance(instance.id.toString(), updatedInstance);

        setSignatureStatus("signed");

        toast({
          title: "Document Signed",
          description: "Your signature has been successfully applied!",
        });
        closeDialog();

        // Close dialog after showing success
        setTimeout(() => {
          setIsSignatureDialogOpen(false);
          setSignatureStatus("idle");
        }, 2000);
      }
    } catch (error) {
      console.error("Error applying signature:", error);
      setSignatureStatus("error");
      toast({
        title: "Error",
        description: "Failed to apply signature.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all forms
  const fetchForms = useCallback(async () => {
    if (forms.length > 0) return;

    try {
      const response = await getAllForms();
      setForms(response);
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while fetching forms.",
        type: "foreground",
      });
    }
  }, [forms.length, setForms, toast]);

  // Fetch form record data
  const fetchFormRecord = useCallback(
    async (recordId: string) => {
      if (!recordId) return;

      try {
        setIsLoading(true);
        const response: FormRecord = await getFormRecordById(Number(recordId));

        const formFieldValues = response.formFieldValues.reduce(
          (acc, field) => {
            acc[field.formField.name] = field.value;
            return acc;
          },
          {} as Record<string, string>,
        );

        setFormValues(formFieldValues);
      } catch (error) {
        console.error("Error fetching form record:", error);
        toast({
          title: "Error",
          description: "An error occurred while fetching the form record.",
          type: "foreground",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  // Navigate to file view
  const handleFileClick = useCallback(
    (fileId: string) => {
      router.push(`/dashboard/folders/file/${fileId}`);
    },
    [router],
  );

  // Handle form approval
  const handleApprove = async () => {
    setIsLoading(true);
    try {
      if (instance.metadata!.signature === undefined) {
        toast({
          title: "Signature Required",
          description: "Please add your signature before approving.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      await moveToNextStep(instance);
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during approval.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form rejection
  const handleReject = () => {
    setIsRejectDialogOpen(true);
  };

  // Confirm rejection with reason
  const handleRejectConfirm = async () => {
    if (!nodeWithForm || !instance.id) return;

    setIsLoading(true);
    try {
      const updatedInstance = { ...instance };
      if (!updatedInstance.metadata) updatedInstance.metadata = {};
      updatedInstance.metadata[instance.currentStep] = rejectionReason;

      await updateWorkflowInstance(instance.id.toString(), updatedInstance);
      await updateWorkflowInstanceStep(instance.id.toString(), nodeWithForm.id);

      toast({
        title: "Rejected",
        description: "The form has been rejected.",
      });

      setIsRejectDialogOpen(false);
      setRejectionReason("");
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while rejecting the form.",
        type: "foreground",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Move workflow to next step
  const moveToNextStep = async (instance: WorkflowInstance) => {
    if (!instance.id) {
      throw new Error("Instance ID is missing");
    }

    const possibleEdges = instance.workflow.edges.filter(
      (edge: Edge) => edge.source === instance.currentStep,
    );

    if (possibleEdges.length === 0) {
      const endNode = instance.workflow.nodes.find(
        (node: WorkflowNode) => node.type === "end",
      );

      if (endNode?.type === "end") {
        const updatedInstance = {
          ...instance,
          status: "Completed" as const,
        };
        await updateWorkflowInstance(instance.id.toString(), updatedInstance);
        toast({
          title: "Workflow Completed",
          description: "This workflow instance has reached its end node.",
        });
      } else {
        throw new Error("No valid paths found from current step.");
      }
    } else if (possibleEdges.length === 1) {
      await updateWorkflowInstanceStep(
        instance.id.toString(),
        possibleEdges[0].target,
      );
      toast({
        title: "Step Updated",
        description: "Successfully moved to next step in workflow.",
      });
    } else {
      throw new Error(
        "Multiple possible paths found - conditional routing required",
      );
    }
  };

  // Load forms on initial render
  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  // Find the relevant form and node when instance changes
  useEffect(() => {
    if (!forms.length || !instance) return;

    const currentNode = instance.workflow.nodes.find(
      (node) => node.id === instance.currentStep,
    );

    if (!currentNode) return;

    const form = forms.find(
      (form) => form.id == Number(currentNode.data?.formId),
    );

    if (!form) return;
    setSelectedForm(form);

    const formNode = instance.workflow.nodes.find(
      (node) => Number(node.data?.formId) === form.id && node.type === "form",
    );

    if (!formNode) return;
    setNodeWithForm(formNode);

    if (instance.metadata && formNode.id) {
      const newFormRecordId = instance.metadata[formNode.id] || "";
      setFormRecordId(newFormRecordId);
    }
  }, [forms, instance]);

  // Fetch form record when the formRecordId changes
  useEffect(() => {
    if (formRecordId) {
      fetchFormRecord(formRecordId);
    }
  }, [formRecordId, fetchFormRecord]);

  if (!selectedForm) {
    return <div className="p-4">Loading form details...</div>;
  }

  return (
    <div>
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">{selectedForm.name}</h2>
        <p>{selectedForm.description}</p>

        {isLoading ? (
          <div className="py-8 text-center">Loading form data...</div>
        ) : (
          <div className="space-y-4">
            {selectedForm.formFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={`field-${field.id}`}>{field.name}</Label>
                {field.type.toLowerCase() === "select" ? (
                  <Select disabled value={formValues[field.name] || ""}>
                    <SelectTrigger id={`field-${field.id}`} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {field.selectOptions?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type.toLowerCase() === "file" ? (
                  <div className="mt-1">
                    <div
                      className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors cursor-pointer group"
                      onClick={() => handleFileClick(formValues[field.name])}
                    >
                      <div className="flex-grow">
                        <div className="font-medium text-blue-600 group-hover:underline">
                          Attached File
                        </div>
                        <div className="text-xs text-gray-500">
                          Click to view file
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFileClick(formValues[field.name]);
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Input
                    id={`field-${field.id}`}
                    type={field.type.toLowerCase()}
                    value={formValues[field.name] || ""}
                    readOnly
                    className="w-full bg-gray-100"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center mt-6">
          <Button
            onClick={() => setIsSignatureDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            disabled={isLoading}
          >
            <Pen size={16} />
            Add Signature
          </Button>

          <div className="flex space-x-4">
            <Button
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Approve"}
            </Button>
            <Button
              onClick={handleReject}
              variant="destructive"
              disabled={isLoading}
            >
              Reject
            </Button>
          </div>
        </div>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Form</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejectionReason">Reason for Rejection</Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signature Dialog */}
      <Dialog
        open={isSignatureDialogOpen}
        onOpenChange={setIsSignatureDialogOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Your Signature</DialogTitle>
          </DialogHeader>

          {signatureStatus === "signed" ? (
            <div className="py-6 text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Signature Applied!
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Your signature has been successfully added to the document.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Signer Name Input */}
              <div>
                <Label htmlFor="signerName">Your Name</Label>
                <Input
                  id="signerName"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Enter your full name"
                  className="mt-1"
                />
              </div>

              {/* Signature Mode Selection */}
              <div>
                <Label>Signature Method</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={signatureMode === "upload" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSignatureMode("upload")}
                  >
                    <Upload size={16} className="mr-1" />
                    Upload
                  </Button>
                  <Button
                    variant={signatureMode === "draw" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSignatureMode("draw")}
                  >
                    <Pen size={16} className="mr-1" />
                    Draw
                  </Button>
                  {existingSignatures.length > 0 && (
                    <Button
                      variant={
                        signatureMode === "existing" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setSignatureMode("existing")}
                    >
                      <FileText size={16} className="mr-1" />
                      Saved
                    </Button>
                  )}
                </div>
              </div>

              {/* Upload Mode */}
              {signatureMode === "upload" && (
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload size={16} className="mr-2" />
                    Choose Signature Image
                  </Button>
                  {uploadedSignature && (
                    <div className="mt-2">
                      <img
                        src={uploadedSignature}
                        alt="Uploaded signature"
                        className="max-h-20 border rounded"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Draw Mode */}
              {signatureMode === "draw" && (
                <div className="space-y-2">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={150}
                    className="border border-gray-300 rounded cursor-crosshair w-full"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCanvas}
                    className="w-full"
                  >
                    <X size={16} className="mr-1" />
                    Clear
                  </Button>
                </div>
              )}

              {/* Existing Signatures Mode */}
              {signatureMode === "existing" && (
                <div className="space-y-2">
                  <Select
                    value={selectedExistingSignatureId}
                    onValueChange={(value: any) =>
                      handlerSetExistingSignatures({
                        id: parseInt(value),
                        name: "",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a saved signature" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingSignatures.map((sig) => (
                        <SelectItem key={sig.id} value={sig.id.toString()}>
                          {sig.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedExistingSignature && (
                    <div className="mt-2">
                      {(() => {
                        return selectedExistingSignature ? (
                          <img
                            src={selectedExistingSignature}
                            alt="Selected signature"
                            className="max-h-20 border rounded"
                          />
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {signatureStatus === "signed" ? (
              <Button onClick={() => setIsSignatureDialogOpen(false)}>
                Close
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsSignatureDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSignatureSubmit}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? "Applying..." : "Apply Signature"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewFormRecord;
