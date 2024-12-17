"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit2, Trash2 } from 'lucide-react'

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

interface LeadsTableProps {
  leads: Lead[]
  onEdit: (lead: Lead) => void
  onDelete: (leadId: string) => void
}

export function LeadsTable({ leads, onEdit, onDelete }: LeadsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox />
            </TableHead>
            <TableHead>Lead</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Activity</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <Checkbox />
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{lead.title}</span>
                  <span className="text-sm text-muted-foreground">Call</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {lead.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm">{lead.activity.text}</span>
                  <span className="text-xs text-muted-foreground">
                    {lead.activity.date} {lead.activity.time}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm">{lead.assignedTo}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm">{lead.createdAt}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(lead)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(lead.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

