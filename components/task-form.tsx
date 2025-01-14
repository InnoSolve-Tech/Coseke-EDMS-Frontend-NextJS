"use client";

import { useState, useEffect } from "react";
import AssignmentIcon from "@mui/icons-material/Assignment";
import axios from "axios";
import { Task } from "../components/task";
import { AxiosInstance } from "./routes/api";
import FormLabel from "@mui/joy/FormLabel";
import FormControl from "@mui/joy/FormControl";
import Typography from "@mui/joy/Typography";
import Input from "@mui/joy/Input";
import Button from "@mui/joy/Button";
import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import Stepper from "@mui/joy/Stepper";
import Step from "@mui/joy/Step";
import StepIndicator from "@mui/joy/StepIndicator";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import Textarea from "@mui/joy/Textarea";

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (task: Task) => void;
}

export default function TaskForm({ open, onClose, onSubmit }: TaskFormProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<Task>({
    title: "",
    date: new Date().toISOString().split("T")[0],
    priority: "",
    dueDate: "",
    id: 0,
    description: "",
    timelineReason: "",
    roles: [],
    startDate: "",
    assignees: [],
    deadline: "",
    status: "contracted",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Prepare data for backend
      const preparedData = {
        ...formData,
        roles: formData.roles.join(","),
        assignees: formData.assignees.join(","),
      };

      // Send POST request to backend
      const response = await AxiosInstance.post(
        "tasks/api/v1/tasks/create",
        preparedData,
      );

      // Call onSubmit with the created task
      onSubmit(response.data);

      // Reset form
      setFormData({
        title: "",
        dueDate: "",
        id: NaN,
        date: new Date().toISOString().split("T")[0],
        priority: "",
        description: "",
        timelineReason: "",
        roles: [],
        startDate: "",
        assignees: [],
        deadline: "",
        status: "contracted",
      });

      // Close the form
      onClose();
    } catch (error) {
      console.error("Error creating task:", error);
      // Optionally add error handling (e.g., show error message)
    }
  };

  const handleNext = () => {
    if (activeStep === 2) {
      handleSubmit(new Event("submit") as any);
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <FormControl>
              <FormLabel>Title</FormLabel>

              <Input
                name="title"
                required
                placeholder="Task Name"
                value={formData.title}
                onChange={(e: any) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </FormControl>

            <FormControl>
              <FormLabel>Priority</FormLabel>

              <Select
                name="priority"
                placeholder="Select Priority"
                value={formData.priority}
                onChange={(_: any, value: string | null) =>
                  setFormData({ ...formData, priority: value || "" })
                }
              >
                <Option value="low">Low</Option>
                <Option value="medium">Medium</Option>
                <Option value="high">High</Option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Status</FormLabel>

              <Select
                name="status"
                placeholder="Select status"
                value={formData.status}
                onChange={(_: any) =>
                  setFormData({ ...formData, status: "qualified" })
                }
              >
                <Option value="contracted">Contracted</Option>
                <Option value="qualified">Qualified</Option>
                <Option value="Closed">Closed</Option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel> Description</FormLabel>

              <Textarea
                minRows={3}
                placeholder="Add description for the task and the reason why you have to do the task"
                value={formData.description}
                onChange={(e: { target: { value: any } }) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </FormControl>

            <FormControl>
              <FormLabel>Task ID</FormLabel>

              <Input
                name="id"
                placeholder="Task id"
                value={formData.id}
                onChange={handleChange}
              />
            </FormControl>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <FormControl>
              <FormLabel>Start Date</FormLabel>

              <Input
                name="startDate"
                type="date"
                placeholder="Starting date"
                value={formData.startDate}
                onChange={(e: any) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
            </FormControl>

            <FormControl>
              <FormLabel>Deadline</FormLabel>

              <Input
                name="deadline"
                type="date"
                placeholder="Deadline"
                value={formData.deadline}
                onChange={(e: any) =>
                  setFormData({ ...formData, deadline: e.target.value })
                }
              />
            </FormControl>

            <FormControl>
              <FormLabel>Reason for the timeline</FormLabel>

              <Textarea
                minRows={3}
                placeholder="Explain why the task is located at that timeline and given that specific weight"
                value={formData.timelineReason}
                onChange={(e: any) =>
                  setFormData({ ...formData, timelineReason: e.target.value })
                }
              />
            </FormControl>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <FormControl>
              <FormLabel> Assignees</FormLabel>

              <Input
                name="assignees"
                placeholder="Add participants (comma-separated)"
                value={formData.assignees.join(", ")}
                onChange={(e: { target: { value: string } }) =>
                  setFormData({
                    ...formData,
                    assignees: e.target.value
                      .split(",")
                      .map((item) => item.trim()),
                  })
                }
              />
            </FormControl>

            <FormControl>
              <FormLabel>Roles</FormLabel>

              <Input
                name="roles"
                placeholder="Assign permissions to participants (comma-separated)"
                value={formData.roles.join(", ")}
                onChange={(e: { target: { value: string } }) =>
                  setFormData({
                    ...formData,
                    roles: e.target.value.split(",").map((item) => item.trim()),
                  })
                }
              />
            </FormControl>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog size="lg" sx={{ width: "600px", height: "500px" }}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-center gap-2 mb-6">
            <AssignmentIcon />
            <Typography component="h4">Task</Typography>
          </div>

          <Stepper component="div">
            {/* Stepper remains the same as in your original code */}
            {/* (Stepper code from previous submission) */}
          </Stepper>

          <div className="mt-6 flex-grow overflow-y-auto">
            {renderStepContent(activeStep)}
          </div>

          <div className="mt-6 flex justify-between">
            <Button
              variant="outlined"
              color="primary"
              onClick={handleBack}
              disabled={activeStep === 0}
            >
              Back
            </Button>
            <div className="space-x-2">
              <Button variant="outlined" color="primary" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleNext}>
                {activeStep === 2 ? "Create Task" : "Next"}
              </Button>
            </div>
          </div>
        </div>
      </ModalDialog>
    </Modal>
  );
}
