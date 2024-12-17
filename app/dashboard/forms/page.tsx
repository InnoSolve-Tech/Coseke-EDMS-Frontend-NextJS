import { FormList } from "@/components/forms/FormList";
import { CreateFormButton } from "@/components/forms/CreateFormButton";
import { Form } from "@/components/forms/FormList";

export const metadata = {
  title: "Form List",
  description: "List of all created forms",
};

export default async function FormsPage() {
  const forms = await fetchForms();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Forms List</h1>
        <CreateFormButton />
      </div>
      <FormList forms={forms} />
    </div>
  );
}

async function fetchForms(): Promise<Form[]> {
  // In a real application, you would fetch this data from your API
  // For this example, we'll use mock data
  return [
    {
      id: 1,
      name: "Customer Feedback",
      description: "A form to collect customer feedback",
      fieldDefinitions: {
        name: { type: "text" },
        email: { type: "email" },
        rating: { type: "number" },
        comments: { type: "textarea" },
      },
    },
    {
      id: 2,
      name: "Employee Survey",
      description: "Annual employee satisfaction survey",
      fieldDefinitions: {
        department: {
          type: "select",
          selectOptions: {
            options: ["HR", "Engineering", "Sales", "Marketing"],
          },
        },
        yearsOfService: { type: "number" },
        satisfactionLevel: { type: "number" },
        suggestions: { type: "textarea" },
      },
    },
    {
      id: 3,
      name: "Event Registration",
      description: "A form to register for company events",
      fieldDefinitions: {
        name: { type: "text" },
        email: { type: "email" },
        eventDate: { type: "date" },
        dietaryPreferences: { type: "textarea" },
      },
    },
  ];
}
