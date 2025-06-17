"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getAllForms } from "@/core/forms/api";
import type { Form } from "@/lib/types/forms";
import { getFormRecordByForm } from "@/core/formrecords/api";
import type { FormRecord } from "@/lib/types/formRecords";
import RecordDetailsDialog from "./RecordDetailsDialog";

export default function ViewFormRecords() {
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [records, setRecords] = useState<FormRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FormRecord | null>(null);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await getAllForms();
        setForms(response);
      } catch (error) {
        console.error("Error fetching forms:", error);
        toast({
          title: "Error",
          description: "Failed to fetch forms. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchForms();
  }, []);

  useEffect(() => {
    if (selectedFormId) {
      fetchRecords(selectedFormId);
    }
  }, [selectedFormId]);

  const fetchRecords = async (formId: string) => {
    setIsLoading(true);
    try {
      const response = await getFormRecordByForm(Number.parseInt(formId));
      setRecords(response);
    } catch (error) {
      console.error("Error fetching records:", error);
      toast({
        title: "Error",
        description: "Failed to fetch records. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (record: FormRecord) => {
    setSelectedRecord(record);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">View Form Records</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="formSelect"
              className="text-sm font-medium text-gray-700"
            >
              Select a Form
            </Label>
            <Select onValueChange={setSelectedFormId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a form" />
              </SelectTrigger>
              <SelectContent>
                {forms.map((form) => (
                  <SelectItem key={form.id} value={form.id!.toString()}>
                    {form.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center">Loading records...</div>
          ) : records.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Created Date</TableHead>
                  {records &&
                    records[0].form.formFields.map((value, index) => (
                      <TableHead key={index}>{value.name}</TableHead>
                    ))}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.id}</TableCell>
                    <TableCell>
                      {new Date(
                        record.createdDate!.toString(),
                      ).toLocaleString()}
                    </TableCell>
                    {Object.values(record.formFieldValues).map(
                      (value, index) => (
                        <TableCell key={index}>{value.value}</TableCell>
                      ),
                    )}
                    <TableCell>
                      <Button onClick={() => handleViewDetails(record)}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center">
              No records found for the selected form.
            </div>
          )}
        </div>
      </CardContent>
      {selectedRecord && (
        <RecordDetailsDialog
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </Card>
  );
}
