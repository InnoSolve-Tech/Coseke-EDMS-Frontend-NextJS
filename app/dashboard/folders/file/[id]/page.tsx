"use client"

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { Box, Button, Card, CardContent, FormControl, FormLabel, Input, Select, Option, Snackbar, Typography, IconButton, Stack, Divider } from '@mui/joy'
import { Edit as EditIcon, Close as CloseIcon, Description as DescriptionIcon } from '@mui/icons-material'
import { ColorPaletteProp } from '@mui/joy/styles'

interface Metadata {
  [key: string]: string
}

interface Document {
  id: number
  documentName: string
  documentType: string
  hashName: string
  mimeType: string
  metadata: Metadata
}

const dummyDocument: Document = {
  id: 1,
  documentName: "Sample Document",
  documentType: "User Manual",
  hashName: "abc123",
  mimeType: "application/pdf",
  metadata: {
    author: 'John Doe',
    creationDate: '2023-05-15',
    lastModified: '2023-05-20',
    version: '1.0',
  }
}

const documentTypes = ["User Manual", "Procurement Document", "Contract"]

const FileViewPage = () => {
  const {} = useParams()
  const [document, setDocument] = useState<Document>(dummyDocument)  
  const [snackbar, setSnackbar] = useState<{open: boolean; color: ColorPaletteProp, message: string}>({ open: false, message: '', color: 'success' })

  const handleMetadataChange = (key: string, value: string) => {
    setDocument({
      ...document,
      metadata: { ...document.metadata, [key]: value }
    })
  }

  const handleSubmit = () => {
    console.log('Updated document:', document)
    showSnackbar('Document updated successfully', 'success')
  }

  const showSnackbar = (message: string, color: ColorPaletteProp) => {
    setSnackbar({ open: true, message, color })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: '100vh', bgcolor: 'background.body' }}>
      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        <Typography level="h2" sx={{ mb: 2 }}>File Preview</Typography>
        <Card variant="outlined" sx={{ height: 'calc(100% - 60px)' }}>
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <DescriptionIcon sx={{ fontSize: 100, color: 'primary.300', mb: 2 }} />
            <Typography level="body-lg" textAlign="center">
              Preview not available for dummy data.<br />File type: {document.mimeType}
            </Typography>
          </CardContent>
        </Card>
      </Box>
      <Divider orientation="vertical" />
      <Box sx={{ width: { xs: '100%', md: 400 }, p: 3, bgcolor: 'background.level1' }}>
        <Card variant="outlined">
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography level="h3" startDecorator={<EditIcon />}>
              Edit Metadata
            </Typography>
            <FormControl>
              <FormLabel>Document Name</FormLabel>
              <Input
                value={document.documentName}
                onChange={(e) => setDocument({ ...document, documentName: e.target.value })}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Document Type</FormLabel>
              <Select
                value={document.documentType}
                onChange={(_, value) => setDocument({ ...document, documentType: value as string })}
              >
                {documentTypes.map((type) => (
                  <Option key={type} value={type}>{type}</Option>
                ))}
              </Select>
            </FormControl>
            <Divider />
            <Typography level="title-md">Additional Metadata</Typography>
            <Stack spacing={2}>
              {Object.entries(document.metadata).map(([key, value]) => (
                <FormControl key={key}>
                  <FormLabel>{key.charAt(0).toUpperCase() + key.slice(1)}</FormLabel>
                  <Input
                    value={value}
                    onChange={(e) => handleMetadataChange(key, e.target.value)}
                  />
                </FormControl>
              ))}
            </Stack>
            <Button 
              onClick={handleSubmit} 
              sx={{ mt: 2 }}
              startDecorator={<EditIcon />}
            >
              Update Metadata
            </Button>
          </CardContent>
        </Card>
      </Box>
      <Snackbar
        variant="soft"
        color={snackbar.color}
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        startDecorator={<DescriptionIcon />}
        endDecorator={
          <IconButton
            onClick={() => setSnackbar({ ...snackbar, open: false })}
            size="sm"
            variant="plain"
            color="neutral"
          >
            <CloseIcon />
          </IconButton>
        }
      >
        {snackbar.message}
      </Snackbar>
    </Box>
  )
}

export default FileViewPage

