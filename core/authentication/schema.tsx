"use client";

import * as yup from "yup";

export const loginSchema = yup.object().shape({
  email: yup.string().required("Email number is required").email(),
  password: yup
    .string()
    .required("Password is required")
    .max(20, "Length of password must not be greater than 10")
    .min(5, "Length of password must not be less than 10"),
});
