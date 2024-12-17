"use client";

import * as React from "react";
import { CssVarsProvider, extendTheme } from "@mui/joy/styles";
import GlobalStyles from "@mui/joy/GlobalStyles";
import CssBaseline from "@mui/joy/CssBaseline";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Link from "@mui/joy/Link";
import Input from "@mui/joy/Input";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import { loginSchema } from "@/core/authentication/schema";
import { loginService } from "@/core/authentication/api";
import { updateSessionStorage } from "@/components/routes/sessionStorage";
import { ILoginState } from "@/core/authentication/interface";
import axios from "axios";

export default function Home() {
  const router = useRouter();
  const [error, setError] = React.useState("");

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: loginSchema,
    onSubmit: async (values: ILoginState) => {
      try {
        const response = await loginService(values);
        updateSessionStorage(response); // Store user details and token in session storage
        router.push("/dashboard"); // Redirect to the dashboard
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
          setError("Invalid email or password. Please try again.");
        } else {
          setError("An unexpected error occurred. Please try again.");
        }
      }
    },    
  });

  return (
  <main>
   <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundImage:
            "url(https://images.unsplash.com/photo-1527181152855-fc03fc7949c8?auto=format&w=1000&dpr=2)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: "100%",
            maxWidth: "400px",
            padding: 4,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderRadius: "8px",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Stack sx={{ gap: 1 }}>
            <Typography component="h1" level="h3">
              Sign in
            </Typography>
          </Stack>
          <form onSubmit={formik.handleSubmit}>
            <FormControl required error={Boolean(formik.errors.email && formik.touched.email)}>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.errors.email && formik.touched.email && (
                <Typography level="body-sm" color="danger">
                  {formik.errors.email}
                </Typography>
              )}
            </FormControl>
            <FormControl required error={Boolean(formik.errors.password && formik.touched.password)}>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                name="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.errors.password && formik.touched.password && (
                <Typography level="body-sm" color="danger">
                  {formik.errors.password}
                </Typography>
              )}
            </FormControl>
            {error && (
              <Typography level="body-sm" color="danger" sx={{ textAlign: "center" }}>
                {error}
              </Typography>
            )}
            <Button type="submit" className="mt-5" fullWidth>
              Sign in
            </Button>
          </form>
          <Link level="title-sm" href="#replace-with-a-link">
            Forgot your password?
          </Link>
          <Typography level="body-xs" sx={{ textAlign: "center" }}>
            © Coseke EDMS System {new Date().getFullYear()}
          </Typography>
        </Box>
      </Box>
  </main>
  );
}
