import { Form, FieldType } from "@/lib/types/forms";

export const dummyForms: Form[] = [
  {
    id: 1,
    name: "Customer Feedback",
    description: "A form to collect customer feedback about our services",
    formFields: [
      {
        id: "field-name",
        name: "Full Name",
        type: "text" as FieldType,
      },
      {
        id: "field-email",
        name: "Email",
        type: "email" as FieldType,
      },
      {
        id: "field-rating",
        name: "Rating",
        type: "number" as FieldType,
      },
      {
        id: "field-comments",
        name: "Comments",
        type: "textarea" as FieldType,
      },
    ],
  },
  {
    id: 2,
    name: "Job Application",
    description: "Standard job application form for all positions",
    formFields: [
      {
        id: "field-name",
        name: "Full Name",
        type: "text" as FieldType,
      },
      {
        id: "field-email",
        name: "Email",
        type: "email" as FieldType,
      },
      {
        id: "field-experience",
        name: "Years of Experience",
        type: "number" as FieldType,
      },
      {
        id: "field-cover-letter",
        name: "Cover Letter",
        type: "textarea" as FieldType,
      },
    ],
  },
  {
    id: 3,
    name: "Event Registration",
    description: "Registration form for upcoming company events",
    formFields: [
      {
        id: "field-name",
        name: "Attendee Name",
        type: "text" as FieldType,
      },
      {
        id: "field-email",
        name: "Email",
        type: "email" as FieldType,
      },
      {
        id: "field-event",
        name: "Event Selection",
        type: "select" as FieldType,
        selectOptions: [
          { label: "Annual Conference", value: "annual-conference" },
          { label: "Training Workshop", value: "training-workshop" },
          { label: "Networking Event", value: "networking-event" },
        ],
      },
      {
        id: "field-dietary",
        name: "Dietary Restrictions",
        type: "textarea" as FieldType,
      },
    ],
  },
];
