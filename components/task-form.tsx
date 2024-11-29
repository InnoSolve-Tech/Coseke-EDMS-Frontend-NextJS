"use client";

import { useState } from 'react'
import { Modal, ModalDialog, Stepper, Step, StepIndicator, Button, Input, Select, Option, Textarea, Typography } from '@mui/joy'
import type { TaskFormData } from '../components/task'
import AssignmentIcon from '@mui/icons-material/Assignment'

interface TaskFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (formData: TaskFormData) => void
}

export default function TaskForm({ open, onClose, onSubmit }: TaskFormProps) {
  const [activeStep, setActiveStep] = useState(0)
  const [formData, setFormData] = useState<TaskFormData>({
    name: '',
    priority: 'medium',
    description: '',
    createdDate: new Date().toISOString().split('T')[0],
    startDate: '',
    deadline: '',
    weight: 0,
    timelineReason: '',
    assignees: [],
    roles: []
  })

  const handleNext = () => {
    if (activeStep === 2) {
      onSubmit(formData)
      onClose()
    } else {
      setActiveStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    setActiveStep((prev) => prev - 1)
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <Input
              required
              placeholder="Task Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Select
              placeholder="Select Priority"
              value={formData.priority}
              onChange={(_, value) => setFormData({ ...formData, priority: value as string })}
            >
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
            </Select>
            <Textarea
              minRows={3}
              placeholder="Add description for the task and the reason why you have to do the task"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        )
      case 1:
        return (
          <div className="space-y-4">
            <Input
              type="date"
              placeholder="Starting date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            <Input
              type="date"
              placeholder="Deadline"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Task weight (%)"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
            />
            <Textarea
              minRows={3}
              placeholder="Explain why the task is located that time timeline and given that specific weight"
              value={formData.timelineReason}
              onChange={(e) => setFormData({ ...formData, timelineReason: e.target.value })}
            />
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <Input
              placeholder="Add participants"
              value={formData.assignees.join(', ')}
              onChange={(e) => setFormData({ ...formData, assignees: e.target.value.split(', ') })}
            />
            <Input
              placeholder="Assign permissions to participants"
              value={formData.roles.join(', ')}
              onChange={(e) => setFormData({ ...formData, roles: e.target.value.split(', ') })}
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog size="lg" sx={{ width: '600px', height: '500px' }}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-center gap-2 mb-6">
            <AssignmentIcon />
            <Typography level="h3">Task</Typography>
          </div>

          <Stepper component="div">
            <Step 
              indicator={<StepIndicator>1</StepIndicator>}
              sx={{
                '& .MuiStepIndicator-root': {
                  borderColor: activeStep === 0 ? 'primary.500' : undefined
                },
                '&::after': {
                  backgroundColor: activeStep === 0 ? 'primary.500' : undefined,
                  height: '2px',
                  bottom: '-8px'
                }
              }}
            >
              <Typography
                sx={{
                  color: activeStep === 0 ? 'primary.500' : undefined
                }}
              >
                Details
              </Typography>
            </Step>
            <Step
              indicator={<StepIndicator>2</StepIndicator>}
              sx={{
                '& .MuiStepIndicator-root': {
                  borderColor: activeStep === 1 ? 'primary.500' : undefined
                },
                '&::after': {
                  backgroundColor: activeStep === 1 ? 'primary.500' : undefined,
                  height: '2px',
                  bottom: '-8px'
                }
              }}
            >
              <Typography
                sx={{
                  color: activeStep === 1 ? 'primary.500' : undefined
                }}
              >
                Date and time
              </Typography>
            </Step>
            <Step
              indicator={<StepIndicator>3</StepIndicator>}
              sx={{
                '& .MuiStepIndicator-root': {
                  borderColor: activeStep === 2 ? 'primary.500' : undefined
                },
                '&::after': {
                  backgroundColor: activeStep === 2 ? 'primary.500' : undefined,
                  height: '2px',
                  bottom: '-8px'
                }
              }}
            >
              <Typography
                sx={{
                  color: activeStep === 2 ? 'primary.500' : undefined
                }}
              >
                Participants
              </Typography>
            </Step>
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
              <Button
                variant="outlined"
                color="neutral"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                onClick={handleNext}
              >
                {activeStep === 2 ? 'Create Task' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      </ModalDialog>
    </Modal>
  )
}

