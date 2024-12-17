'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { FileText } from 'lucide-react'
import { getAllWorkflows } from "@/core/workflows/api"
import { Workflow } from '@/lib/types/workflow'
import { createWorkflowInstance, getAllWorkflowInstances } from '@/core/workflowInstance/api'

type WorkflowInstance = {
  id: number
  workflowId: number
  name: string
  status: 'Active' | 'Completed' | 'Suspended'
  startFormData?: Record<string, string>
}

const formSchema = z.object({
  workflowId: z.string().min(1, "Please select a workflow"),
  name: z.string().min(1, "Instance name is required"),
  startFormData: z.record(z.string()).optional(),
})

export default function WorkflowInstanceCreator() {
  const [workflowInstances, setWorkflowInstances] = useState<WorkflowInstance[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [existingWorkflows, setExistingWorkflows] = useState<Workflow[]>([])

  useEffect(() => {
    // Fetch existing workflows from the API
    const fetchWorkflows = async () => { 
      try {
        let wfs = await getAllWorkflows();
        let wfI = await getAllWorkflowInstances();
        console.log(wfs);
        setWorkflowInstances(wfI);
        setExistingWorkflows(wfs);
      } catch (error) {
        console.error("Failed to fetch workflows:", error);
        // Optionally, show an error toast or message to the user
      }
    }

    fetchWorkflows();
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workflowId: '',
      name: '',
      startFormData: {},
    },
  })

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const newInstance = {
      workflow: {id: data.workflowId} as any,
      name: data.name,
      status: 'Active',
    }
    await createWorkflowInstance(newInstance)
    form.reset()
  }

  const handleWorkflowSelect = (workflowId: string) => {
    const workflow = existingWorkflows.find(w => w.id === workflowId)
    setSelectedWorkflow(workflow || null)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Workflow Instance Creator</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="create" className="space-y-4">
          <TabsList>
            <TabsTrigger value="create">Create Instance</TabsTrigger>
            <TabsTrigger value="view">View Instances</TabsTrigger>
          </TabsList>
          <TabsContent value="create">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="workflowId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Workflow</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value)
                        handleWorkflowSelect(value)
                      }} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a workflow" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className='bg-white bg-opacity-100'>
                          {existingWorkflows.map((workflow) => (
                            <SelectItem key={workflow.id} value={workflow.id.toString()}>
                              <div className="flex items-center">
                                <span>{workflow.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instance Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter instance name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Create Workflow Instance</Button>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value="view">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Instance Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflowInstances.map((instance) => (
                  <TableRow key={instance.id}>
                    <TableCell>{instance.id}</TableCell>
                    <TableCell>{existingWorkflows.find(w => parseInt(w.id) === instance.workflowId)?.name}</TableCell>
                    <TableCell>{instance.name}</TableCell>
                    <TableCell>
                      <Badge variant={instance.status === 'Active' ? 'default' : instance.status === 'Completed' ? 'secondary' : 'destructive'}>
                        {instance.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <FileText className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Instance Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold">Workflow</h4>
                              <p>{existingWorkflows.find(w => parseInt(w.id) === instance.workflowId)?.name}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold">Instance Name</h4>
                              <p>{instance.name}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold">Status</h4>
                              <Badge variant={instance.status === 'Active' ? 'default' : instance.status === 'Completed' ? 'secondary' : 'destructive'}>
                                {instance.status}
                              </Badge>
                            </div>
                            {instance.startFormData && (
                              <div>
                                <h4 className="font-semibold">Start Form Data</h4>
                                <div className="bg-muted p-4 rounded-md">
                                  {Object.entries(instance.startFormData).map(([key, value]) => (
                                    <p key={key}><strong>{key}:</strong> {value}</p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}