import { createContext, useContext, useState } from 'react';
import { Workflow } from '@/lib/types/workflow';
import axios from 'axios';

interface WorkflowContextType {
  workflow: Partial<Workflow>;
  updateWorkflow: (data: Partial<Workflow>) => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export function WorkflowProvider({ children }: { children: React.ReactNode }) {
  const [workflow, setWorkflow] = useState<Partial<Workflow>>({
    name: '',
    description: '',
    nodes: [],
    edges: [],
  });

  const updateWorkflow = async (data: Partial<Workflow>) => {
    setWorkflow(prev => ({ ...prev, ...data }));
    await axios.post('http://localhost:8787/workflows/api/v1/workflows', workflow);
    console.log(workflow);
  };

  return (
    <WorkflowContext.Provider value={{ workflow, updateWorkflow }}>
      {children}
    </WorkflowContext.Provider>
  );
}

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) throw new Error('useWorkflow must be used within WorkflowProvider');
  return context;
}; 