import { Search, Plus, Settings2, ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LeadsTable } from "../../../../components/activity/leads-table"
interface Lead {
    id: string
    title: string
    status: string
    activity: {
      text: string
      date: string
      time: string
    }
    assignedTo: string
    createdAt: string
  }

export default function LeadsPage() {
    function handleEdit(lead: Lead): void {
        console.log("Editing lead:", lead)
    }

    function handleDelete(leadId: string): void {
        throw new Error('Function not implemented.')
    }

  return (
    
    <div className="flex h-screen bg-background">
      
      {/* Main content */}
      <main className="flex-1">
        {/* Top navigation */}
        {/* Page header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold">Leads</h1>
            <div className="flex items-center gap-2">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                CREATE
              </Button>
              <Button variant="outline">
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search leads..." className="pl-8" />
            </div>
          </div>
        </div>


        {/* Table */}
        <div className="p-4">
            <LeadsTable onEdit={handleEdit} onDelete={handleDelete} leads={[]}/>
        </div>
      </main>
    </div>
  )
}

