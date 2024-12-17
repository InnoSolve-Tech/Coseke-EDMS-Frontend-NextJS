"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalDialog,
  Stepper,
  Step,
  StepIndicator,
  Button,
  Input,
  Select,
  Option,
  Textarea,
  Typography,
} from "@mui/joy";
import AssignmentIcon from "@mui/icons-material/Assignment";
import axios from "axios";
import { Task } from "../components/task";
import { number } from "yup";
import { AxiosInstance } from "./routes/api";

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
    id: NaN,
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
        "/api/v1/tasks/create",
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
            <Input
              name="title"
              required
              placeholder="Task Name"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
            <Select
              name="priority"
              placeholder="Select Priority"
              value={formData.priority}
              onChange={(_, value) =>
                setFormData({ ...formData, priority: value as string })
              }
            >
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
            </Select>
            <Select
              name="status"
              placeholder="Select status"
              value={formData.status}
              onChange={(_, value) =>
                setFormData({ ...formData, status: "qualified" })
              }
            >
              <Option value="contracted">Contracted</Option>
              <Option value="qualified">Qualified</Option>
              <Option value="Closed">Closed</Option>
            </Select>
            <Textarea
              minRows={3}
              placeholder="Add description for the task and the reason why you have to do the task"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
            <Input
              name="id"
              placeholder="Task id"
              value={formData.id}
              onChange={handleChange}
            />
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <Input
              name="startDate"
              type="date"
              placeholder="Starting date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
            />
            <Input
              name="deadline"
              type="date"
              placeholder="Deadline"
              value={formData.deadline}
              onChange={(e) =>
                setFormData({ ...formData, deadline: e.target.value })
              }
            />

            <Textarea
              minRows={3}
              placeholder="Explain why the task is located at that timeline and given that specific weight"
              value={formData.timelineReason}
              onChange={(e) =>
                setFormData({ ...formData, timelineReason: e.target.value })
              }
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <Input
              name="assignees"
              placeholder="Add participants (comma-separated)"
              value={formData.assignees.join(", ")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  assignees: e.target.value
                    .split(",")
                    .map((item) => item.trim()),
                })
              }
            />
            <Input
              name="roles"
              placeholder="Assign permissions to participants (comma-separated)"
              value={formData.roles.join(", ")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  roles: e.target.value.split(",").map((item) => item.trim()),
                })
              }
            />
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
            <Typography level="h3">Task</Typography>
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
              color="neutral"
              onClick={handleBack}
              disabled={activeStep === 0}
            >
              Back
            </Button>
            <div className="space-x-2">
              <Button variant="outlined" color="neutral" onClick={onClose}>
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
