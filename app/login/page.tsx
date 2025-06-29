"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import Link from "next/link";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, ArrowLeft } from "lucide-react";
import { loginSchema } from "@/core/authentication/schema";
import { loginService } from "@/core/authentication/api";
import { updateSessionStorage } from "@/components/routes/sessionStorage";
import type { ILoginState } from "@/core/authentication/interface";

export default function LoginPage() {
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
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          "url(https://images.unsplash.com/photo-1527181152855-fc03fc7949c8?auto=format&w=1000&dpr=2)",
      }}
    >
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 w-full max-w-md p-6">
        {/* Back to Home Link */}
        <Link
          href="/"
          className="inline-flex items-center text-white hover:text-gray-200 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">
                Coseke EDMS
              </span>
            </div>
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={
                    formik.errors.email && formik.touched.email
                      ? "border-red-500"
                      : ""
                  }
                />
                {formik.errors.email && formik.touched.email && (
                  <p className="text-sm text-red-500">{formik.errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={
                    formik.errors.password && formik.touched.password
                      ? "border-red-500"
                      : ""
                  }
                />
                {formik.errors.password && formik.touched.password && (
                  <p className="text-sm text-red-500">
                    {formik.errors.password}
                  </p>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full mt-6"
                disabled={formik.isSubmitting}
              >
                {formik.isSubmitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="#replace-with-a-link"
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
              >
                Forgot your password?
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                © {new Date().getFullYear()} Coseke EDMS System. All rights
                reserved.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
