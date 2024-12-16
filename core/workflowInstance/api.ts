// /api/workflowInstance.ts

import { WorkflowInstance } from "@/lib/types/workflowInstance"; // Import the WorkflowInstance type
import { AxiosInstance } from "../../components/routes/api"; // Adjust the path to where AxiosInstance is defined

/**
 * Function to create a new WorkflowInstance
 * @param workflowInstance The data of the workflow instance to be created
 * @returns The created workflow instance data
 */
export const createWorkflowInstance = async (workflowInstance: WorkflowInstance) => {
  try {
    const response = await AxiosInstance.post("/api/workflow-instances", workflowInstance);
    return response.data; // Return the created workflow instance data
  } catch (error) {
    console.error("Error creating Workflow Instance:", error);
    throw new Error("Unable to create Workflow Instance");
  }
};

/**
 * Function to get all WorkflowInstances
 * @returns List of all workflow instances
 */
export const getAllWorkflowInstances = async () => {
  try {
    const response = await AxiosInstance.get("/workflows/api/v1/workflowss");
    return response.data; // Return the list of workflow instances
  } catch (error) {
    console.error("Error fetching Workflow Instances:", error);
    throw new Error("Unable to fetch Workflow Instances");
  }
};

/**
 * Function to get a specific WorkflowInstance by ID
 * @param id The ID of the workflow instance
 * @returns The specific workflow instance data
 */
export const getWorkflowInstanceById = async (id: string) => {
  try {
    const response = await AxiosInstance.get(`/api/workflow-instances/${id}`);
    return response.data; // Return the specific workflow instance data
  } catch (error) {
    console.error(`Error fetching Workflow Instance with ID ${id}:`, error);
    throw new Error(`Unable to fetch Workflow Instance with ID ${id}`);
  }
};

/**
 * Function to delete a WorkflowInstance by ID
 * @param id The ID of the workflow instance to delete
 * @returns The confirmation of deletion
 */
export const deleteWorkflowInstanceById = async (id: string) => {
  try {
    const response = await AxiosInstance.delete(`/api/workflow-instances/${id}`);
    return response.data; // Return the confirmation of deletion
  } catch (error) {
    console.error(`Error deleting Workflow Instance with ID ${id}:`, error);
    throw new Error(`Unable to delete Workflow Instance with ID ${id}`);
  }
};

/**
 * Function to update an existing WorkflowInstance
 * @param id The ID of the workflow instance to update
 * @param updatedWorkflowInstance The updated data of the workflow instance
 * @returns The updated workflow instance data
 */
export const updateWorkflowInstance = async (id: string, updatedWorkflowInstance: WorkflowInstance) => {
  try {
    const response = await AxiosInstance.put(`/api/workflow-instances/${id}`, updatedWorkflowInstance);
    return response.data; // Return the updated workflow instance data
  } catch (error) {
    console.error(`Error updating Workflow Instance with ID ${id}:`, error);
    throw new Error(`Unable to update Workflow Instance with ID ${id}`);
  }
};
