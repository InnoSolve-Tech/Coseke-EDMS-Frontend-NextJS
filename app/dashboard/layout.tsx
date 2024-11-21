"use client";

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { CssVarsProvider } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';

export default function DashboardLayout({
    children, // will be a page or nested layout
  }: {
    children: React.ReactNode
  }) {
    return (
        <CssVarsProvider disableTransitionOnChange>
      <CssBaseline />
      <Header />
      <Sidebar>
{children}
      </Sidebar>
      
      </CssVarsProvider>
    )
  }