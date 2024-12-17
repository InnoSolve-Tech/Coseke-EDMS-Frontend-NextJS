"use client"

import { getFilesByHash, getFilesById } from '@/components/files/api'
import { Close as CloseIcon, Description as DescriptionIcon, InsertDriveFileOutlined as DocIcon, Download as DownloadIcon, Edit as EditIcon, TableChartOutlined as ExcelIcon, PictureAsPdfOutlined as PdfIcon } from '@mui/icons-material'
import { Box, Button, Card, CardContent, Divider, FormControl, FormLabel, IconButton, Input, Option, Select, Snackbar, Stack, Typography } from '@mui/joy'
import { ColorPaletteProp } from '@mui/joy/styles'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'

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
  const { id } = useParams();
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{open: boolean; color: ColorPaletteProp, message: string}>({ 
    open: false, 
    message: '', 
    color: 'success' 
  })
  const [previewState, setPreviewState] = useState<{
    excelData?: any[] | null
  }>({
    excelData: null
  })

  const documentTypes = ["User Manual", "Procurement Document", "Contract"]

  // Fetch file details on component mount
  useEffect(() => {
    const fetchFileDetails = async () => {
      try {
        const res = await getFilesById(parseInt(id as string));
        const response = await getFilesByHash(res.hashName);
        console.log('File details response:', response);
        
        if (response) {
          const fileData = {
            ...res,
            fileLink: URL.createObjectURL(new Blob([response])),
            mimeType: res.mimeType
          }
          
          setDocument(fileData)
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

    fetchFileDetails();
  }, [id])

  // Parse Excel files
  useEffect(() => {
    const parseExcelFile = async () => {
      if (document && (document.mimeType.includes('spreadsheetml') || document.mimeType === 'application/vnd.ms-excel')) {
        try {
          const arrayBuffer = await fetch(document.fileLink!).then(res => res.arrayBuffer())
          const workbook = XLSX.read(arrayBuffer, { type: 'buffer' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          setPreviewState(prev => ({ ...prev, excelData: data as any[] }))
        } catch (error) {
          console.error('Error parsing Excel file:', error)
        }
      }
    }

    parseExcelFile()
  }, [document?.fileLink, document?.mimeType])

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
    if (!document || !document.hashName || !document.filename) {
      console.error('Invalid document object');
      showSnackbar('Invalid document', 'danger');
      return;
    }
  
    try {
      const blob = await getFilesByHash(document.hashName);
  
      if (!blob || !(blob instanceof Blob)) {
        throw new Error('Invalid file data');
      }
  
      const link = window.document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = document.filename;
      link.style.display = 'none';
      window.document.body.appendChild(link);
      link.click();
  
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Download failed:', error);
      showSnackbar('Failed to download file', 'danger');
    }
  };

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

  const renderPreview = () => {
    const mimeType = document.mimeType.toLowerCase()

    // Image preview
    if (mimeType.startsWith('image/')) {
      return (
        <Card variant="outlined" sx={{ height: 'calc(100% - 60px)' }}>
          <CardContent 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <img 
              src={document.fileLink || ""} 
              alt={document.filename}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '70vh', 
                objectFit: 'contain' 
              }} 
            />
            <Typography level="body-lg" textAlign="center" sx={{ mt: 2 }}>
              {document.filename}<br />
              File type: {document.mimeType}
            </Typography>
            <Button 
              onClick={handleDownload}
              startDecorator={<DownloadIcon />}
              sx={{ mt: 2 }}
            >
              Download File
            </Button>
          </CardContent>
        </Card>
      )
    }

    // PDF preview with iframe
    if (mimeType === 'application/pdf') {
      return (
        <Card variant="outlined" sx={{ height: 'calc(100% - 60px)', overflow: 'auto' }}>
          <CardContent 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <iframe
              src={`${document.fileLink}#navpanes=0&toolbar=0`}
              width="100%"
              height="600"
              style={{ border: 'none' }}
              title="PDF Preview"
            />
            <Typography level="body-lg" textAlign="center" sx={{ mt: 2 }}>
              {document.filename}
            </Typography>
            <Button 
              onClick={handleDownload}
              startDecorator={<DownloadIcon />}
              sx={{ mt: 2 }}
            >
              Download PDF
            </Button>
          </CardContent>
        </Card>
      )
    }

    // Video preview
    if (mimeType.startsWith('video/')) {
      return (
        <Card variant="outlined" sx={{ height: 'calc(100% - 60px)' }}>
          <CardContent 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <video 
              controls 
              src={document.fileLink || ""} 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '70vh' 
              }}
            >
              Your browser does not support the video tag.
            </video>
            <Typography level="body-lg" textAlign="center" sx={{ mt: 2 }}>
              {document.filename}<br />
              File type: {document.mimeType}
            </Typography>
            <Button 
              onClick={handleDownload}
              startDecorator={<DownloadIcon />}
              sx={{ mt: 2 }}
            >
              Download Video
            </Button>
          </CardContent>
        </Card>
      )
    }

    // Excel files with data table
    if (
      mimeType === 'application/vnd.ms-excel' || 
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      return (
        <Card variant="outlined" sx={{ height: 'calc(100% - 60px)', overflow: 'auto' }}>
          <CardContent 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <ExcelIcon sx={{ fontSize: 100, color: 'primary.300', mb: 2 }} />
            <Typography level="body-lg" textAlign="center">
              Excel Document: {document.filename}
            </Typography>
            {previewState.excelData && (
              <Box sx={{ width: '100%', maxHeight: '500px', overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {(previewState.excelData[0] as any).map((header:any, index:any) => (
                        <th 
                          key={index} 
                          style={{ 
                            border: '1px solid #ddd', 
                            padding: '8px', 
                            backgroundColor: '#f2f2f2' 
                          }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(previewState.excelData as any).slice(1).map((row:any, rowIndex:any) => (
                      <tr key={rowIndex}>
                        {row.map((cell:any, cellIndex:any) => (
                          <td 
                            key={cellIndex} 
                            style={{ 
                              border: '1px solid #ddd', 
                              padding: '8px' 
                            }}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}
            <Button 
              onClick={handleDownload}
              startDecorator={<DownloadIcon />}
              sx={{ mt: 2 }}
            >
              Download Excel File
            </Button>
          </CardContent>
        </Card>
      )
    }

    // Word documents with iframe
    if (
      mimeType === 'application/msword' || 
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return (
        <Card variant="outlined" sx={{ height: 'calc(100% - 60px)' }}>
          <CardContent 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(document!.fileLink!)}&embedded=true`}
              width="100%"
              height="500"
              style={{ border: 'none' }}
              title="Document Preview"
            />
            <Typography level="body-lg" textAlign="center" sx={{ mt: 2 }}>
              Word Document: {document.filename}
            </Typography>
            <Button 
              onClick={handleDownload}
              startDecorator={<DownloadIcon />}
              sx={{ mt: 2 }}
            >
              Download Document
            </Button>
          </CardContent>
        </Card>
      )
    }
  }
  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: '100vh', bgcolor: 'background.body' }}>
      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        <Typography level="h2" sx={{ mb: 2 }}>File Preview</Typography>
        {renderPreview()}
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