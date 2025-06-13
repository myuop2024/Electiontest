import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, BookOpen, PlusCircle } from "lucide-react";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient as useTanstackQueryClient } from '@tanstack/react-query'; // Aliased import

// Define an interface for the new course data
interface NewCourseData {
  title: string;
  description: string;
  targetAudience: string; // Changed from role to targetAudience to match schema
  difficulty: string;
  isActive: boolean;
  // duration and passingScore could be added here if needed on creation
}

const CreateCoursePage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useTanstackQueryClient(); // Use aliased import

  const [formData, setFormData] = useState<NewCourseData>({
    title: '',
    description: '',
    targetAudience: 'Observer', // Default targetAudience
    difficulty: 'beginner',
    isActive: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isActive: checked }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const mutation = useMutation({
    mutationFn: (newCourse: NewCourseData) => {
      // The backend POST /api/training/courses expects 'trainingCourses' schema fields
      // Ensure formData matches what the backend expects (e.g. targetAudience)
      return apiRequest('POST', '/api/training/courses', newCourse).then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error || 'Failed to create course') });
        }
        return res.json();
      });
    },
    onSuccess: () => {
      toast({ title: "Course Created", description: "The new course has been successfully created." });
      queryClient.invalidateQueries({ queryKey: ['/api/training/courses'] });
      setLocation('/admin/training/courses');
    },
    onError: (error: Error) => {
      toast({ title: "Error creating course", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Link href="/admin/training/courses">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <BookOpen className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Create New Course</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
            <CardDescription>Fill in the information for the new training course.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Select name="targetAudience" value={formData.targetAudience} onValueChange={(value) => handleSelectChange('targetAudience', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Observer">Observer</SelectItem>
                    <SelectItem value="Coordinator">Coordinator</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="All">All Roles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select name="difficulty" value={formData.difficulty} onValueChange={(value) => handleSelectChange('difficulty', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch id="isActive" checked={formData.isActive} onCheckedChange={handleSwitchChange} />
              <Label htmlFor="isActive">Set course as active immediately</Label>
            </div>
          </CardContent>
        </Card>
        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating...' : <><PlusCircle className="mr-2 h-4 w-4" /> Create Course</>}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateCoursePage;
