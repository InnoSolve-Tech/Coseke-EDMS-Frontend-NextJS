// Interface for select options
export interface SelectOption {
  label: string;
  value: string;
}

// Define the allowed field types
export type FieldType =
  | "text"
  | "number"
  | "select"
  | "checkbox"
  | "radio"
  | "date"
  | "textarea";

export interface FormField {
  id: string;
  name: string;
  type: FieldType;
  selectOptions?: SelectOption[];
}

export interface Form {
  id?: number;
  name: string;
  description: string;
  formFields: FormField[];
}
