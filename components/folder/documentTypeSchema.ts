import * as yup from "yup";

export const documentTypeSchema = yup.object({
  name: yup.string().required("Document type name is required"),
  metadata: yup.array().of(
    yup.object({
      name: yup.string().required(),
      type: yup.string().required(),
      value: yup.string(),
    }),
  ),
});
