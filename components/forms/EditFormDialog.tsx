'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlusIcon, TrashIcon, XIcon } from 'lucide-react'

interface SelectOptions {
  options: string[]
}

interface FieldDefinition {
  type: typeof fieldTypes[number]
  value: string
  selectOptions?: SelectOptions
}

interface Form {
  id?: number
  name: string
  description: string
  fieldDefinitions: Record<string, FieldDefinition>
  selectOptions?: SelectOptions
}

interface EditFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (formData: Form) => void
  initialData?: Form
}

const fieldTypes = [
  'text',
  'number',
  'email',
  'password',
  'date',
  'time',
  'textarea',
  'select',
] as const

export function EditFormDialog({ isOpen, onClose, onSave, initialData }: EditFormDialogProps) {
  const [formData, setFormData] = useState<Form>({
    name: '',
    description: '',
    fieldDefinitions: {},
  })

  const [newSelectOption, setNewSelectOption] = useState<{[key: string]: string}>({})

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({
        name: '',
        description: '',
        fieldDefinitions: {},
      })
    }
  }, [initialData, isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFieldChange = (fieldName: string, fieldType: typeof fieldTypes[number]) => {
    setFormData((prev) => ({
      ...prev,
      fieldDefinitions: { 
        ...prev.fieldDefinitions, 
        [fieldName]: { 
          type: fieldType, 
          value: '',
        } 
      },
      selectOptions: { options: [] }
    }))
  }

  const handleFieldValueChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      fieldDefinitions: {
        ...prev.fieldDefinitions,
        [fieldName]: {
          ...prev.fieldDefinitions[fieldName],
          value
        }
      }
    }))
  }

  const handleAddSelectOption = (fieldName: string) => {
    const optionToAdd = newSelectOption[fieldName]
    if (optionToAdd) {
      setFormData((prev) => {
        const currentOptions = prev.fieldDefinitions[fieldName].selectOptions?.options || []
        return {
          ...prev,
          fieldDefinitions: {
            ...prev.fieldDefinitions,
            [fieldName]: {
              ...prev.fieldDefinitions[fieldName],
              selectOptions: {
                options: [...currentOptions, optionToAdd]
              }
            }
          }
        }
      })
      
      // Reset the new option input
      setNewSelectOption(prev => ({ ...prev, [fieldName]: '' }))
    }
  }

  const handleRemoveSelectOption = (fieldName: string, optionToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      fieldDefinitions: {
        ...prev.fieldDefinitions,
        [fieldName]: {
          ...prev.fieldDefinitions[fieldName],
          selectOptions: {
            options: (prev.fieldDefinitions[fieldName].selectOptions?.options || [])
              .filter(option => option !== optionToRemove)
          }
        }
      }
    }))
  }

  const handleAddField = () => {
    const newFieldName = `field${Object.keys(formData.fieldDefinitions).length + 1}`
    handleFieldChange(newFieldName, 'text')
  }

  const handleRemoveField = (fieldName: string) => {
    const newFieldDefinitions = { ...formData.fieldDefinitions }
    delete newFieldDefinitions[fieldName]
    setFormData((prev) => ({ ...prev, fieldDefinitions: newFieldDefinitions }))
  }

  const renderFieldInput = (fieldName: string, fieldData: Form['fieldDefinitions'][string]) => {
    const commonProps = {
      value: fieldData.value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        handleFieldValueChange(fieldName, e.target.value),
      className: "flex-grow"
    }

    switch (fieldData.type) {
      case 'textarea':
        return <Textarea {...commonProps} />
      case 'number':
        return <Input 
          {...commonProps} 
          type="number" 
          onChange={(e) => handleFieldValueChange(fieldName, e.target.value)}
        />
      case 'email':
        return <Input 
          {...commonProps} 
          type="email" 
          pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
        />
      case 'password':
        return <Input 
          {...commonProps} 
          type="password" 
          minLength={8}
        />
      case 'date':
        return <Input 
          {...commonProps} 
          type="date" 
        />
      case 'time':
        return <Input 
          {...commonProps} 
          type="time" 
        />
      case 'select':
        return (
          <div className="flex flex-col space-y-2">
            <Select 
              value={fieldData.value}
              onValueChange={(value) => handleFieldValueChange(fieldName, value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent className='bg-white bg-opacity-100'>
                {fieldData.selectOptions?.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex space-x-2">
              <Input 
                value={newSelectOption[fieldName] || ''}
                onChange={(e) => setNewSelectOption(prev => ({
                  ...prev, 
                  [fieldName]: e.target.value
                }))}
                placeholder="New option"
                className="flex-grow"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => handleAddSelectOption(fieldName)}
                disabled={!newSelectOption[fieldName]}
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
            {(fieldData.selectOptions?.options?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {fieldData?.selectOptions?.options.map((option) => (
                  <div 
                    key={option} 
                    className="flex items-center bg-gray-100 rounded-md px-2 py-1 text-sm"
                  >
                    {option}
                    <Button 
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="ml-1 h-4 w-4"
                      onClick={() => handleRemoveSelectOption(fieldName, option)}
                    >
                      <XIcon className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      default:
        return <Input {...commonProps} />
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px] bg-white bg-opacity-100">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Form' : 'Create Form'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Fields</Label>
              <div className="col-span-3 space-y-2">
                {Object.entries(formData.fieldDefinitions).map(([fieldName, fieldData]) => (
                  <div key={fieldName} className="flex items-center gap-2">
                    <Input
                      value={fieldName}
                      onChange={(e) => {
                        const newFieldDefinitions = { ...formData.fieldDefinitions }
                        delete newFieldDefinitions[fieldName]
                        newFieldDefinitions[e.target.value] = fieldData
                        setFormData((prev) => ({ ...prev, fieldDefinitions: newFieldDefinitions }))
                      }}
                      className="w-[120px]"
                    />
                    <Select
                      value={fieldData.type}
                      onValueChange={(value) => handleFieldChange(fieldName, value as typeof fieldTypes[number])}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className='bg-white bg-opacity-100'>
                        {fieldTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {renderFieldInput(fieldName, fieldData)}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveField(fieldName)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={handleAddField}>
                  <PlusIcon className="mr-2 h-4 w-4" /> Add Field
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}