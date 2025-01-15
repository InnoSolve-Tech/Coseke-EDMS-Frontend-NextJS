"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2 } from "lucide-react";

interface Condition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface DecisionConditionsProps {
  conditions: Condition[];
  onConditionsChange: (conditions: Condition[]) => void;
  availableFields: string[];
}

export function DecisionConditions({
  conditions,
  onConditionsChange,
  availableFields,
}: DecisionConditionsProps) {
  const [newCondition, setNewCondition] = useState<Condition>({
    id: "",
    field: "",
    operator: "",
    value: "",
  });

  const operators = ["==", "!=", ">", "<", ">=", "<="];

  const addCondition = () => {
    if (newCondition.field && newCondition.operator && newCondition.value) {
      const updatedConditions = [
        ...conditions,
        { ...newCondition, id: Date.now().toString() },
      ];
      onConditionsChange(updatedConditions);
      setNewCondition({ id: "", field: "", operator: "", value: "" });
    }
  };

  const removeCondition = (id: string) => {
    const updatedConditions = conditions.filter(
      (condition) => condition.id !== id,
    );
    onConditionsChange(updatedConditions);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Label>Field</Label>
        <Label>Operator</Label>
        <Label>Value</Label>
        <Label>Action</Label>
      </div>
      {conditions.map((condition) => (
        <div key={condition.id} className="grid grid-cols-4 gap-4 items-center">
          <Select
            value={condition.field}
            onValueChange={(value) =>
              onConditionsChange(
                conditions.map((c) =>
                  c.id === condition.id ? { ...c, field: value } : c,
                ),
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {availableFields.map((field) => (
                <SelectItem key={field} value={field}>
                  {field}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={condition.operator}
            onValueChange={(value) =>
              onConditionsChange(
                conditions.map((c) =>
                  c.id === condition.id ? { ...c, operator: value } : c,
                ),
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select operator" />
            </SelectTrigger>
            <SelectContent>
              {operators.map((op) => (
                <SelectItem key={op} value={op}>
                  {op}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={condition.value}
            onChange={(e) =>
              onConditionsChange(
                conditions.map((c) =>
                  c.id === condition.id ? { ...c, value: e.target.value } : c,
                ),
              )
            }
            placeholder="Enter value"
          />
          <Button
            variant="destructive"
            size="icon"
            onClick={() => removeCondition(condition.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <div className="grid grid-cols-4 gap-4 items-end">
        <Select
          value={newCondition.field}
          onValueChange={(value) =>
            setNewCondition({ ...newCondition, field: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select field" />
          </SelectTrigger>
          <SelectContent>
            {availableFields.map((field) => (
              <SelectItem key={field} value={field}>
                {field}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={newCondition.operator}
          onValueChange={(value) =>
            setNewCondition({ ...newCondition, operator: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select operator" />
          </SelectTrigger>
          <SelectContent>
            {operators.map((op) => (
              <SelectItem key={op} value={op}>
                {op}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={newCondition.value}
          onChange={(e) =>
            setNewCondition({ ...newCondition, value: e.target.value })
          }
          placeholder="Enter value"
        />
        <Button onClick={addCondition}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>
    </div>
  );
}
