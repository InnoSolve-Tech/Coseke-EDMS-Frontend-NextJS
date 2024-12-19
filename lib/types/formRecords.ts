import { Form, FormField } from "./forms";

export interface FormFieldValue {
  formField: FormField;
  value: string;
}

export interface FormRecord {
  id?: number;
  form: Form;
  userId: number;
  formFieldValues: FormFieldValue[];
  createdDate?: string;
  createdBy: string;
}
