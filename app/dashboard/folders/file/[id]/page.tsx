"use client"

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Box, Button, Card, CardContent, FormControl, FormLabel, Input, Select, Option, Snackbar, Typography, IconButton, Stack, Divider } from '@mui/joy'
import { Edit as EditIcon, Close as CloseIcon, Description as DescriptionIcon, Download as DownloadIcon } from '@mui/icons-material'
import { ColorPaletteProp } from '@mui/joy/styles'
import { getFilesByHash, getFilesById } from '@/components/files/api'


interface Metadata {
  [key: string]: string | string[]
}

interface Document {
  id: number
  folderID: number
  filename: string
  documentType: string
  documentName: string
  hashName: string
  fileLink: string | null
  mimeType: string
  metadata: Metadata
  createdDate: string
  lastModifiedDateTime: string
  lastModifiedBy: number
  createdBy: number
}

const FileViewPage = () => {
  const { fileId } = useParams()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{open: boolean; color: ColorPaletteProp, message: string}>({ 
    open: false, 
    message: '', 
    color: 'success' 
  })

  const documentTypes = ["User Manual", "Procurement Document", "Contract"]

  // Fetch file details on component mount
// Fetch file details on component mount
useEffect(() => {
  const fetchFileDetails = async () => {
    try {
      if (!document?.hashName) {
        throw new Error('No hash name provided')
      }
      
      const response = await getFilesByHash(document.hashName)
      
      console.log('File details response:', response)
      
      // Assuming the response contains the file data
      if (response) {
        // Transform the response to match your Document interface
        const fileData = response // Adjust this based on the actual response structure
        
        setDocument({
          ...document,
          // Add any additional fields from the response
          fileLink: URL.createObjectURL(new Blob([response])),
          mimeType: fileData.type || document.mimeType
        })
      } else {
        throw new Error('No file found')
      }
    } catch (err) {
      console.error('Error fetching file details:', err)
      setError('Failed to load file details')
      showSnackbar('Failed to load file details', 'danger')
    } finally {
      setLoading(false)
    }
  }

  if (document?.hashName) {
    fetchFileDetails()
  }
}, [document?.hashName])

  const handleMetadataChange = (key: string, value: string) => {
    if (!document) return

    setDocument({
      ...document,
      metadata: { 
        ...document.metadata, 
        [key]: value 
      }
    })
  }

  const handleSubmit = () => {
    if (!document) return

    console.log('Updated document:', document)
    showSnackbar('Document metadata updated successfully', 'success')
    // TODO: Implement actual metadata update API call
  }

  const showSnackbar = (message: string, color: ColorPaletteProp) => {
    setSnackbar({ open: true, message, color })
  }

  const handleDownload = async () => {
    if (!document) return
  
    try {
      const blob = await getFilesByHash(document.hashName)
      
      // Create a temporary anchor element to trigger download
      const link = window.document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = document.filename
      link.style.display = 'none'
      window.document.body.appendChild(link)
      link.click()
      
      // Clean up
      window.document.body.removeChild(link)
      window.URL.revokeObjectURL(link.href)
    } catch (error) {
      console.error('Download failed:', error)
      showSnackbar('Failed to download file', 'danger')
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading file details...</Typography>
      </Box>
    )
  }

  if (error || !document) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography color="danger">{error || 'No file found'}</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: '100vh', bgcolor: 'background.body' }}>
      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        <Typography level="h2" sx={{ mb: 2 }}>File Preview</Typography>
        <Card variant="outlined" sx={{ height: 'calc(100% - 60px)' }}>
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <DescriptionIcon sx={{ fontSize: 100, color: 'primary.300', mb: 2 }} />
            <Typography level="body-lg" textAlign="center">
              {document.filename}<br />
              File type: {document.mimeType}
            </Typography>
            <Button 
              onClick={handleDownload}
              startDecorator={<DownloadIcon />}
              sx={{ mt: 2 }}
              disabled // Disable until hashName is properly populated
            >
              Download File
            </Button>
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
                    value={typeof value === 'object' ? value.join(', ') : value}
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