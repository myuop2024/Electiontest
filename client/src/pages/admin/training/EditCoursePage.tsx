import React, { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, BookOpen, Save } from "lucide-react";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from '@tanstack/react-query';

interface CourseData {
  id: number;
  title: string;
  description: string;
  targetAudience: string; // Changed from role to match schema
  difficulty: string;
  isActive: boolean;
  // Add other fields like duration, passingScore if they are part of the form
}

const EditCoursePage: React.FC = () => {
  const params = useParams();
  const courseId = params.courseId ? parseInt(params.courseId) : null;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useTanstackQueryClient();

  const [formData, setFormData] = useState<Partial<CourseData>>({});

  const { data: existingCourse, isLoading: isLoadingCourse, error: fetchError } = useQuery<CourseData>({
    queryKey: ['course', courseId], // Changed queryKey to be more specific
    queryFn: async () => {
      if (!courseId) throw new Error("Course ID is missing.");
      const response = await apiRequest('GET', `/api/training/courses/${courseId}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Failed to fetch course data' }));
        throw new Error(errData.error || 'Failed to fetch course data');
      }
      return response.json();
    },
    enabled: !!courseId,
    onSuccess: (data) => {
      setFormData({
        title: data.title,
        description: data.description,
        targetAudience: data.targetAudience || 'Observer', // Default if null/undefined
        difficulty: data.difficulty || 'beginner', // Default if null/undefined
        isActive: data.isActive === undefined ? true : data.isActive, // Default if undefined
      });
    },
  });

  useEffect(() => {
    if (fetchError) {
        toast({ title: "Error fetching course", description: (fetchError as Error).message, variant: "destructive" });
    }
  }, [fetchError, toast]);

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
    mutationFn: (updatedCourseData: Partial<CourseData>) => {
      if (!courseId) throw new Error("Course ID is missing for update.");
      // Backend expects trainingCourses schema fields.
      // Ensure 'targetAudience' is sent if 'role' was used in form state previously.
      // The current formData uses targetAudience, so this is fine.
      return apiRequest('PUT', `/api/training/courses/${courseId}`, updatedCourseData).then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error || 'Failed to update course') });
        }
        return res.json();
      });
    },
    onSuccess: () => {
      toast({ title: "Course Updated", description: "The course has been successfully updated." });
      queryClient.invalidateQueries({ queryKey: ['courses'] }); // Invalidate course list
      queryClient.invalidateQueries({ queryKey: ['course', courseId] }); // Invalidate this specific course
      setLocation('/admin/training/courses');
    },
    onError: (error: Error) => {
      toast({ title: "Error updating course", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!courseId || !formData.title || !formData.description) { // Basic validation
        toast({ title: "Validation Error", description: "Title and Description are required.", variant: "destructive"});
        return;
    }
    mutation.mutate(formData);
  };

  if (!courseId) return <div className="p-6 text-red-500">Invalid Course ID.</div>;
  if (isLoadingCourse) return <div className="p-6">Loading course data...</div>;
  if (fetchError) return <div className="p-6 text-red-600">Error loading course: {(fetchError as Error).message}</div>;
  if (!existingCourse) return <div className="p-6">Course not found.</div>;


  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Link href="/admin/training/courses">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <BookOpen className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Edit Course: {existingCourse?.title || ''}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Edit Course Details</CardTitle>
            <CardDescription>Update the information for this training course.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" value={formData.title || ''} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Select name="targetAudience" value={formData.targetAudience || 'Observer'} onValueChange={(value) => handleSelectChange('targetAudience', value)}>
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
                <Select name="difficulty" value={formData.difficulty || 'beginner'} onValueChange={(value) => handleSelectChange('difficulty', value)}>
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
              <Switch id="isActive" checked={formData.isActive === undefined ? true : formData.isActive} onCheckedChange={handleSwitchChange} />
              <Label htmlFor="isActive">Course is active</Label>
            </div>
          </CardContent>
        </Card>
        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={mutation.isPending || isLoadingCourse}>
            {mutation.isPending ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditCoursePage;
