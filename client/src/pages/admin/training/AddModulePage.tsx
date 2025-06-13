import React from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import ModuleForm, { ModuleFormData } from "@/components/admin/training/ModuleForm";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient as useTanstackQueryClient } from '@tanstack/react-query';

const AddModulePage: React.FC = () => {
  const params = useParams();
  const courseId = params.courseId ? parseInt(params.courseId) : null;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useTanstackQueryClient();

  const mutation = useMutation({
    mutationFn: (newModule: ModuleFormData) => {
      if (!courseId) throw new Error("Course ID is missing.");
      return apiRequest('POST', `/api/training/courses/${courseId}/modules`, newModule).then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error || 'Failed to create module') });
        }
        return res.json();
      });
    },
    onSuccess: () => {
      toast({ title: "Module Created", description: "The new module has been added to the course." });
      queryClient.invalidateQueries({ queryKey: ['courseModules', courseId] });
      if (courseId) {
        setLocation(`/admin/training/courses/${courseId}`);
      } else {
        setLocation('/admin/training/courses'); // Fallback
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error Creating Module", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = async (formData: ModuleFormData) => {
    if (!formData.title || !formData.type) {
        toast({ title: "Validation Error", description: "Title and Module Type are required.", variant: "destructive"});
        return;
    }
    // The ModuleForm now handles content as an HTML string for relevant types.
    // No further adaptation needed here for content structure before sending to backend.
    // Backend is expected to handle the HTML string in the 'content' JSON field.
    mutation.mutate(formData);
  };

  if (!courseId) return <div className="p-6">Invalid Course ID.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Link href={`/admin/training/courses/${courseId}`}>
          <Button variant="outline" size="icon" aria-label="Back to course modules">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Add New Module</h1>
      </div>
      <ModuleForm
        courseId={courseId}
        onSubmit={handleSubmit}
        isSaving={mutation.isPending}
        mode="create"
      />
    </div>
  );
};
export default AddModulePage;
