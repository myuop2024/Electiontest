import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, PlusCircle, Trash2 } from "lucide-react"; // Added PlusCircle, Trash2
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger, // Keep if button directly triggers, or remove if state-controlled
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";


// Interfaces for Resources
interface ResourceData {
  mediaId?: number;
  url?: string;
  openInNewTab?: boolean;
}

export interface Resource {
  id: string; // Can be temp client ID (e.g., timestamp) or persistent ID from backend
  type: 'media' | 'url';
  title: string;
  data: ResourceData;
}

// Main Form Data Interface
export interface ModuleFormData {
  title: string;
  description?: string;
  type: 'lesson' | 'quiz' | 'assignment' | 'video' | 'document' | 'standard';
  duration?: number;
  isRequired: boolean;
  content?: string;
  resources: Resource[];
  moduleOrder?: number;
  status?: 'draft' | 'published' | 'archived';
}

interface ModuleFormProps {
  courseId: number;
  moduleData?: Partial<ModuleFormData>; // For pre-filling in edit mode
  onSubmit: (data: ModuleFormData) => Promise<void>;
  isSaving: boolean;
  mode: 'create' | 'edit';
}

// Helper to convert old block content to HTML string (simplified)
const convertBlocksToHtml = (content: any): string => {
  if (typeof content === 'string') return content;
  if (typeof content === 'object' && content !== null && Array.isArray(content.blocks)) {
    return content.blocks.map((block: any) => {
      if (block.type === 'paragraph' && block.data && block.data.text) {
        return `<p>${block.data.text}</p>`;
      }
      return '';
    }).join('');
  }
  return '';
};

const ModuleForm: React.FC<ModuleFormProps> = ({ courseId, moduleData, onSubmit, isSaving, mode }) => {
  const { toast } = useToast();

  const getInitialContent = (data?: Partial<ModuleFormData>): string => {
    if (!data || data.content === undefined || data.content === null) return '';
    if (data.type === 'lesson' || data.type === 'assignment') {
      return convertBlocksToHtml(data.content);
    }
    return typeof data.content === 'string' ? data.content : '';
  };

  const [formData, setFormData] = useState<ModuleFormData>({
    title: moduleData?.title || '',
    description: moduleData?.description || '',
    type: moduleData?.type || 'lesson',
    duration: moduleData?.duration || 0,
    isRequired: moduleData?.isRequired === undefined ? true : moduleData.isRequired,
    content: getInitialContent(moduleData),
    resources: moduleData?.resources || [],
    status: moduleData?.status || 'draft',
    moduleOrder: moduleData?.moduleOrder
  });

  // State for the "Add/Edit Resource" dialog
  const [isAddResourceDialogOpen, setIsAddResourceDialogOpen] = useState(false);
  const [currentResourceData, setCurrentResourceData] = useState<Partial<Resource>>({ type: 'url', data: { openInNewTab: true } });


  useEffect(() => {
    if (moduleData) {
      setFormData({
        title: moduleData.title || '',
        description: moduleData.description || '',
        type: moduleData.type || 'lesson',
        duration: moduleData.duration || 0,
        isRequired: moduleData.isRequired === undefined ? true : moduleData.isRequired,
        content: getInitialContent(moduleData),
        resources: moduleData.resources || [],
        status: moduleData.status || 'draft',
        moduleOrder: moduleData.moduleOrder
      });
    }
  }, [moduleData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'duration' ? parseInt(value) || 0 : value }));
  };

  const handleContentChange = (htmlContent: string) => {
    setFormData(prev => ({ ...prev, content: htmlContent }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => {
      const newType = name === 'type' ? value as ModuleFormData['type'] : prev.type;
      let newContent = prev.content;
      if (name === 'type') {
        newContent = (newType === 'lesson' || newType === 'assignment') ? (prev.content || '') : '';
      }
      return { ...prev, [name]: value, content: newContent };
    });
  };

  const handleCurrentResourceFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checkedValue = (e.target as HTMLInputElement).checked;


    setCurrentResourceData(prev => {
        if (name === "title" || name === "type") {
            const newType = name === "type" ? value as Resource['type'] : prev?.type || 'url';
            return {...prev, [name]: value, data: newType === 'url' ? {url: '', openInNewTab: true} : {mediaId: undefined} };
        }
        if (name === "mediaId" && prev?.type === 'media') {
            return {...prev, data: { ...prev.data, mediaId: parseInt(value) || undefined }};
        }
        if (name === "url" && prev?.type === 'url') {
            return {...prev, data: { ...prev.data, url: value }};
        }
        if (name === "openInNewTab" && prev?.type === 'url') {
            return {...prev, data: { ...prev.data, openInNewTab: isCheckbox ? checkedValue : prev.data?.openInNewTab }};
        }
        return prev;
    });
};


  const handleAddResourceToList = () => {
    if (!currentResourceData.title || !currentResourceData.type) {
      toast({ title: "Validation Error", description: "Resource title and type are required.", variant: "destructive" });
      return;
    }
    if (currentResourceData.type === 'media' && (currentResourceData.data?.mediaId === undefined || isNaN(currentResourceData.data.mediaId))) {
      toast({ title: "Validation Error", description: "Media ID is required for media resources.", variant: "destructive" });
      return;
    }
    if (currentResourceData.type === 'url' && (!currentResourceData.data?.url || !(currentResourceData.data.url.startsWith('http://') || currentResourceData.data.url.startsWith('https://')))) {
      toast({ title: "Validation Error", description: "A valid URL is required for URL resources.", variant: "destructive" });
      return;
    }

    const newResource: Resource = {
      id: Date.now().toString(), // Temporary unique ID
      title: currentResourceData.title,
      type: currentResourceData.type,
      data: currentResourceData.data || {},
    };
    setFormData(prev => ({ ...prev, resources: [...prev.resources, newResource] }));
    setIsAddResourceDialogOpen(false);
    setCurrentResourceData({ type: 'url', data: { openInNewTab: true } }); // Reset for next
  };

  const handleRemoveResource = (resourceId: string) => {
    setFormData(prev => ({ ...prev, resources: prev.resources.filter(r => r.id !== resourceId) }));
  };


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link', 'image'],
      ['clean']
    ],
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{mode === 'create' ? 'Create New Module' : 'Edit Module'}</CardTitle>
          <CardDescription>Fill in the details for the module.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Module Type</Label>
              <Select name="type" value={formData.type} onValueChange={(value) => handleSelectChange('type', value as ModuleFormData['type'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lesson">Lesson (Rich Text)</SelectItem>
                  <SelectItem value="assignment">Assignment (Rich Text Instructions)</SelectItem>
                  <SelectItem value="quiz">Quiz (Link to Quiz ID)</SelectItem>
                  <SelectItem value="video">Video (URL)</SelectItem>
                  <SelectItem value="document">Document (URL/Reference)</SelectItem>
                  <SelectItem value="standard">Standard/Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input id="duration" name="duration" type="number" value={formData.duration} onChange={handleChange} placeholder="e.g., 60" />
            </div>
          </div>

          {(formData.type === 'lesson' || formData.type === 'assignment') ? (
            <div>
              <Label htmlFor="content">Module Content / Instructions</Label>
              <ReactQuill
                theme="snow"
                value={formData.content || ''}
                onChange={handleContentChange}
                modules={quillModules}
                className="bg-background mt-1"
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="content">Content (e.g., Video URL, Document Path, Quiz ID)</Label>
              <Textarea
                id="content"
                name="content"
                value={formData.content || ''}
                onChange={handleChange}
                rows={3}
                placeholder="Enter URL, ID, or simple text content based on module type"
              />
            </div>
          )}

          {/* Resources Section */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
                <Label>Resources</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => { setCurrentResourceData({ type: 'url', data: {openInNewTab: true} }); setIsAddResourceDialogOpen(true); }}>
                    <PlusCircle className="h-4 w-4 mr-2" /> Add Resource
                </Button>
            </div>
            {formData.resources && formData.resources.length > 0 ? (
              <ul className="space-y-2 mt-1">
                {formData.resources.map((resource, index) => (
                  <li key={resource.id || index} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{resource.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Type: {resource.type} -
                        {resource.type === 'url' ? ` URL: ${resource.data?.url}` : ` Media ID: ${resource.data?.mediaId}`}
                      </p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveResource(resource.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">No resources linked yet.</p>
            )}
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="flex items-center space-x-2">
              <Switch id="isRequired" name="isRequired" checked={formData.isRequired} onCheckedChange={(val) => handleSwitchChange('isRequired', val)} />
              <Label htmlFor="isRequired">Is Required</Label>
            </div>
            <div>
                <Label htmlFor="status">Status</Label>
                <Select name="status" value={formData.status} onValueChange={(value) => handleSelectChange('status', value as ModuleFormData['status'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>

        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
            <Link href={`/admin/training/courses/${courseId}`}>
                <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (mode === 'create' ? 'Creating...' : 'Saving...') : (mode === 'create' ? 'Create Module' : 'Save Changes')}
            </Button>
        </CardFooter>
      </Card>
    </form>

    {/* Add Resource Dialog */}
    <AlertDialog open={isAddResourceDialogOpen} onOpenChange={setIsAddResourceDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Add New Resource</AlertDialogTitle>
            <AlertDialogDescription>
                Fill in the details for the new resource.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-2">
                <div>
                    <Label htmlFor="resTitle">Title</Label>
                    <Input id="resTitle" name="title" value={currentResourceData.title || ''} onChange={handleCurrentResourceFieldChange} />
                </div>
                <div>
                    <Label htmlFor="resType">Type</Label>
                    <Select name="type" value={currentResourceData.type || 'url'} onValueChange={(val) => handleCurrentResourceFieldChange({ target: { name: 'type', value: val } } as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="url">URL</SelectItem>
                        <SelectItem value="media">Media Library Item</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {currentResourceData.type === 'url' && (
                    <>
                        <div>
                            <Label htmlFor="resUrl">URL</Label>
                            <Input id="resUrl" name="url" type="url" value={currentResourceData.data?.url || ''} onChange={handleCurrentResourceFieldChange} placeholder="https://example.com" />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="resOpenInNewTab" name="openInNewTab" checked={currentResourceData.data?.openInNewTab === undefined ? true : currentResourceData.data.openInNewTab} onCheckedChange={(val) => handleCurrentResourceFieldChange({target: {name: 'openInNewTab', type: 'checkbox', checked: val}} as any)} />
                            <Label htmlFor="resOpenInNewTab">Open in new tab</Label>
                        </div>
                    </>
                )}
                {currentResourceData.type === 'media' && (
                    <div>
                        <Label htmlFor="resMediaId">Media ID</Label>
                        <Input id="resMediaId" name="mediaId" type="number" value={currentResourceData.data?.mediaId || ''} onChange={handleCurrentResourceFieldChange} placeholder="Enter Media ID" />
                    </div>
                )}
            </div>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCurrentResourceData({ type: 'url', data: {openInNewTab: true} })}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddResourceToList}>Save Resource</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default ModuleForm;
