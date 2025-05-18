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
import { getFormRecordById } from "@/core/formrecords/api";
import { getAllForms } from "@/core/forms/api";
import {
  updateWorkflowInstance,
  updateWorkflowInstanceStep,
} from "@/core/workflowInstance/api";
import { useToast } from "@/hooks/use-toast";
import { FormRecord } from "@/lib/types/formRecords";
import { Form } from "@/lib/types/forms";
import { Edge, WorkflowNode } from "@/lib/types/workflow";
import { WorkflowInstance } from "@/lib/types/workflowInstance";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { FileText, FileImage, File, CheckCircle } from "lucide-react";
import { DocusealForm } from "@docuseal/react";
import { title } from "process";
import { IUserDetails } from "@/core/authentication/interface";
import { getUserFromSessionStorage } from "../routes/sessionStorage";

// DocuSeal types
interface DocuSealResponse {
  submissionId: string;
  status: "pending" | "completed" | "expired";
  signUrl: string;
}

interface DocuSealTemplateParams {
  templateId: string;
  signers: {
    name: string;
    email: string;
    fields?: Record<string, string>;
  }[];
  metadata?: Record<string, string>;
}

interface ViewFormRecordProps {
  instance: WorkflowInstance;
  forms: Form[];
  setForms: (forms: Form[]) => void;
}

const ViewFormRecord = ({ instance, forms, setForms }: ViewFormRecordProps) => {
  const [selectedForm, setSelectedForm] = useState<Form>();
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [nodeWithForm, setNodeWithForm] = useState<WorkflowNode>();
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formRecordId, setFormRecordId] = useState<string>("");
  const user: IUserDetails = getUserFromSessionStorage() as IUserDetails;

  // DocuSeal related states
  const [isDocuSealDialogOpen, setIsDocuSealDialogOpen] = useState(false);
  const [docuSealStatus, setDocuSealStatus] = useState<
    "idle" | "pending" | "completed" | "error"
  >("idle");
  const [docuSealUrl, setDocuSealUrl] = useState<string>("");
  const [signerName, setSignerName] = useState<string>("");

  const { toast } = useToast();
  const router = useRouter();

  // Fetch all forms
  const fetchForms = useCallback(async () => {
    if (forms.length > 0) return; // Only fetch if forms aren't already loaded

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
        console.log("Fetching form record with ID:", recordId);
        const response: FormRecord = await getFormRecordById(Number(recordId));
        console.log("Form record response:", response);

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

  // Mock DocuSeal API call to create a submission
  const createDocuSealSubmission = async (
    params: DocuSealTemplateParams,
  ): Promise<DocuSealResponse> => {
    // This is a mock function that simulates an API call to DocuSeal
    console.log("Creating DocuSeal submission with params:", params);

    // In a real implementation, you would make an actual API request to DocuSeal
    // For now, we'll simulate a response after a delay
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          submissionId: "mock-" + Math.random().toString(36).substring(2, 10),
          status: "pending",
          signUrl: "https://docuseal.com/d/otBhVwViacpfkX", // Sample URL from your provided link
        });
      }, 1000);
    });
  };

  // Handle DocuSeal initiation
  const handleInitiateDocuSeal = async () => {
    setDocuSealStatus("pending");
    try {
      // Prepare form fields for DocuSeal
      const docuSealFields = Object.entries(formValues).reduce(
        (acc, [key, value]) => {
          // Only include text-based values that would be relevant for the document
          if (typeof value === "string" && !value.startsWith("file-")) {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, string>,
      );

      // In a real implementation, you might want to store the submissionId
      // in your database or in the workflow instance metadata

      toast({
        title: "DocuSeal Request Created",
        description: "E-signature request has been sent to the signer.",
      });
    } catch (error) {
      console.error("Error creating DocuSeal submission:", error);
      setDocuSealStatus("error");
      toast({
        title: "Error",
        description: "Failed to create e-signature request.",
        variant: "destructive",
      });
    }
  };

  // Mock function for a successful DocuSeal submission
  const handleDocuSealSuccess = async () => {
    setDocuSealStatus("completed");

    // Update metadata to indicate document was signed
    if (instance.id) {
      const updatedInstance = { ...instance };
      if (!updatedInstance.metadata) updatedInstance.metadata = {};
      updatedInstance.metadata.docuSealSigned = "true";
      updatedInstance.metadata.docuSealSignedAt = new Date().toISOString();

      await updateWorkflowInstance(instance.id.toString(), updatedInstance);

      toast({
        title: "Document Signed",
        description: "The document has been successfully signed!",
      });

      setIsDocuSealDialogOpen(false);
    }
  };

  // Handle form approval
  const handleApprove = async () => {
    setIsLoading(true);
    try {
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
      // Update instance metadata with rejection reason
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
      // Check if we've reached the end node
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

    if (!currentNode) {
      console.log("No current node found for step:", instance.currentStep);
      return;
    }

    console.log("Current node:", currentNode);
    const form = forms.find(
      (form) => form.id == Number(currentNode.data?.formId),
    );

    if (!form) {
      console.log("No form found for formId:", currentNode.data?.formId);
      return;
    }
    setSelectedForm(form);

    const formNode = instance.workflow.nodes.find(
      (node) => Number(node.data?.formId) === form.id && node.type === "form",
    );

    if (!formNode) {
      console.log("No form node found");
      return;
    }
    setNodeWithForm(formNode);

    if (instance.metadata && formNode.id) {
      const newFormRecordId = instance.metadata[formNode.id] || "";
      console.log("Form record ID from metadata:", newFormRecordId);
      setFormRecordId(newFormRecordId);
    }
  }, [forms, instance]);

  // Fetch form record when the formRecordId changes
  useEffect(() => {
    console.log("Form record ID changed to:", formRecordId);
    if (formRecordId) {
      fetchFormRecord(formRecordId);
    }
  }, [formRecordId, fetchFormRecord]);

  if (!selectedForm) {
    return <div className="p-4">Loading form details...</div>;
  }
  const downloadFile = async (url: string, filename: string): Promise<Blob> => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const blob = await response.blob();

      // Create a temporary link element to trigger download
      const downloadLink = document.createElement("a");
      const objectUrl = URL.createObjectURL(blob);

      downloadLink.href = objectUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();

      // Clean up
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(objectUrl);

      return blob;
    } catch (error) {
      console.error("Error downloading file:", error);
      throw error;
    }
  };

  const handleCompletion = async (link: string): Promise<void> => {
    console.log("DocuSeal form completed");
    setDocuSealStatus("completed");

    console.log(link);

    let doc = downloadFile(link, "docuseal.png");
    console.log("DocuSeal document downloaded:", doc);

    // Update metadata to indicate document was signed
    if (instance.id) {
      try {
        const updatedInstance = { ...instance };
        if (!updatedInstance.metadata) updatedInstance.metadata = {};

        //await updateWorkflowInstance(instance.id.toString(), updatedInstance);

        toast({
          title: "Document Signed",
          description: "The document has been successfully signed!",
        });

        // Close dialog after a short delay to show success message
        setTimeout(() => {
          setIsDocuSealDialogOpen(false);
        }, 2000);
      } catch (error) {
        console.error("Error updating workflow instance:", error);
        toast({
          title: "Error",
          description:
            "The document was signed but we couldn't update the workflow.",
          variant: "destructive",
        });
      }
    }
  };

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
            onClick={() => setIsDocuSealDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            disabled={isLoading}
          >
            <FileText size={16} />
            Request E-Signature
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

      {/* DocuSeal Dialog */}
      <Dialog
        open={isDocuSealDialogOpen}
        onOpenChange={(open) => {
          if (!open && docuSealStatus === "pending") {
            // Prevent closing if a request is in progress
            toast({
              title: "Request in Progress",
              description:
                "Please wait until the e-signature request is processed.",
              variant: "destructive",
            });
            return;
          }
          setIsDocuSealDialogOpen(open);
          if (!open) {
            setDocuSealStatus("idle");
            setDocuSealUrl("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request E-Signature</DialogTitle>
          </DialogHeader>

          {docuSealStatus === "completed" ? (
            <div className="py-6 text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                E-Signature Complete!
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                The document has been successfully signed.
              </p>
            </div>
          ) : docuSealStatus === "pending" ? (
            <div className="py-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">DocuSeal Signing URL:</p>
                  <a
                    href={docuSealUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Open signing page
                  </a>
                </div>

                {/* This button simulates a webhook that would notify your app when the document is signed */}
                <Button
                  onClick={handleDocuSealSuccess}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700"
                >
                  Simulate Signed Document (Mock)
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-4">
              <div className="space-y-4">
                <DocusealForm
                  rememberSignature={false}
                  reuseSignature={false}
                  src="https://docuseal.com/d/4itzd1sGVUtzzB"
                  email={user.email}
                  onComplete={async (data) =>
                    handleCompletion(data.values[0].value)
                  }
                  completedMessage={{ title: "", body: "" }}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {docuSealStatus === "completed" ? (
              <Button onClick={() => setIsDocuSealDialogOpen(false)}>
                Close
              </Button>
            ) : docuSealStatus === "pending" ? (
              <Button
                variant="outline"
                onClick={() => {
                  setDocuSealStatus("idle");
                  setDocuSealUrl("");
                }}
              >
                Cancel Request
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsDocuSealDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInitiateDocuSeal}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Send for Signature
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
