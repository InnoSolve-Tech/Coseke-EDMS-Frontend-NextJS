import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, FileImage, FileSpreadsheet, FileCode } from 'lucide-react'

const recentFiles = [
  { id: 1, name: 'Q4 Financial Report.pdf', type: 'PDF', size: '2.5 MB', modified: '2023-12-15' },
  { id: 2, name: 'Project Presentation.pptx', type: 'PPTX', size: '5.1 MB', modified: '2023-12-14' },
  { id: 3, name: 'Employee Data.xlsx', type: 'XLSX', size: '1.8 MB', modified: '2023-12-13' },
  { id: 4, name: 'Product Images.zip', type: 'ZIP', size: '15.2 MB', modified: '2023-12-12' },
  { id: 5, name: 'Website Source Code.js', type: 'JS', size: '0.5 MB', modified: '2023-12-11' },
]

function getFileIcon(type: string) {
  switch (type) {
    case 'PDF':
      return <FileText className="h-5 w-5 text-red-500" />
    case 'PPTX':
      return <FileImage className="h-5 w-5 text-orange-500" />
    case 'XLSX':
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />
    case 'ZIP':
      return <FileText className="h-5 w-5 text-purple-500" />
    case 'JS':
      return <FileCode className="h-5 w-5 text-yellow-500" />
    default:
      return <FileText className="h-5 w-5 text-gray-500" />
  }
}

export function RecentFilesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Files</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Modified</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentFiles.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    {getFileIcon(file.type)}
                    <span className="ml-2">{file.name}</span>
                  </div>
                </TableCell>
                <TableCell>{file.type}</TableCell>
                <TableCell>{file.size}</TableCell>
                <TableCell>{file.modified}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

