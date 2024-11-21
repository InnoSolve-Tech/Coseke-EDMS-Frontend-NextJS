"use client";

import * as React from 'react';
import { CssVarsProvider, extendTheme, useColorScheme } from '@mui/joy/styles';
import GlobalStyles from '@mui/joy/GlobalStyles';
import CssBaseline from '@mui/joy/CssBaseline';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Checkbox from '@mui/joy/Checkbox';
import Divider from '@mui/joy/Divider';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Link from '@mui/joy/Link';
import Input from '@mui/joy/Input';
import Typography from '@mui/joy/Typography';
import Stack from '@mui/joy/Stack';
import { useRouter } from 'next/navigation';

interface FormElements extends HTMLFormControlsCollection {
  email: HTMLInputElement;
  password: HTMLInputElement;
  persistent: HTMLInputElement;
}
interface SignInFormElement extends HTMLFormElement {
  readonly elements: FormElements;
}

const customTheme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          500: '#FB0201',
        },
        background: {
          body: '#0102FC',
        },
      },
    },
    dark: {
      palette: {
        primary: {
          500: '#FB0201',
        },
        background: {
          body: '#FEFF00',
        },
      },
    },
  },
});

export default function Home() {
  const router = useRouter();
  return (
    <CssVarsProvider theme={customTheme} defaultMode="dark" disableTransitionOnChange>
      <CssBaseline />
      <GlobalStyles
        styles={{
          ':root': {
            '--Form-maxWidth': '400px',
            '--Transition-duration': '0.4s',
          },
        }}
      />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundImage:
            'url(https://images.unsplash.com/photo-1527181152855-fc03fc7949c8?auto=format&w=1000&dpr=2)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            width: '100%',
            maxWidth: 'var(--Form-maxWidth)',
            padding: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '8px',
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Stack sx={{ gap: 1 }}>
            <Typography component="h1" level="h3">
              Sign in
            </Typography>
          </Stack>
          <form
            onSubmit={(event: React.FormEvent<SignInFormElement>) => {
              event.preventDefault();
              const formElements = event.currentTarget.elements;
              const data = {
                email: formElements.email.value,
                password: formElements.password.value
              };
              alert(JSON.stringify(data, null, 2));
              router.push('/dashboard');
            }}
          >
            <FormControl required>
              <FormLabel>Email</FormLabel>
              <Input type="email" name="email" />
            </FormControl>
            <FormControl required>
              <FormLabel>Password</FormLabel>
              <Input type="password" name="password" />
            </FormControl>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
            </Box>
            <Button type="submit" className='mt-5' fullWidth>
              Sign in
            </Button>
          </form>
          <Link level="title-sm" href="#replace-with-a-link">
                Forgot your password?
              </Link>
          <Typography level="body-xs" sx={{ textAlign: 'center' }}>
            © Coseke EDMS System {new Date().getFullYear()}
          </Typography>
        </Box>
      </Box>
    </CssVarsProvider>
  );
}
