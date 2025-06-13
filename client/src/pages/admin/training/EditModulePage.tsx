import React, { useEffect } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import ModuleForm, { ModuleFormData } from "@/components/admin/training/ModuleForm";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from '@tanstack/react-query';

interface Module extends ModuleFormData {
  id: number;
  courseId: number;
}

const EditModulePage: React.FC = () => {
  const params = useParams();
  const courseId = params.courseId ? parseInt(params.courseId) : null;
  const moduleId = params.moduleId ? parseInt(params.moduleId) : null;

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useTanstackQueryClient();

  const { data: existingModule, isLoading: isLoadingModule, error: fetchError } = useQuery<Module>({
    queryKey: ['module', moduleId],
    queryFn: async () => {
      if (!moduleId) throw new Error("Module ID is missing.");
      const response = await apiRequest('GET', `/api/training/modules/${moduleId}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Failed to fetch module data' }));
        throw new Error(errData.error || 'Failed to fetch module data');
      }
      return response.json();
    },
    enabled: !!moduleId,
  });

  useEffect(() => {
    if (fetchError) {
        toast({ title: "Error Fetching Module", description: (fetchError as Error).message, variant: "destructive" });
    }
  }, [fetchError, toast]);

  const mutation = useMutation({
    mutationFn: (updatedModuleData: ModuleFormData) => {
      if (!moduleId) throw new Error("Module ID is missing for update.");
      return apiRequest('PUT', `/api/training/modules/${moduleId}`, updatedModuleData).then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error || 'Failed to update module') });
        }
        return res.json();
      });
    },
    onSuccess: (data) => {
      toast({ title: "Module Updated", description: "The module has been successfully updated." });
      queryClient.invalidateQueries({ queryKey: ['courseModules', courseId] });
      queryClient.invalidateQueries({ queryKey: ['module', moduleId] });
      if(courseId) {
        setLocation(`/admin/training/courses/${courseId}`);
      } else {
        setLocation('/admin/training/courses');
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error Updating Module", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = async (formDataFromForm: ModuleFormData) => {
    if (!formDataFromForm.title || !formDataFromForm.type) {
        toast({ title: "Validation Error", description: "Title and Module Type are required.", variant: "destructive"});
        return;
    }
    // The ModuleForm now handles content as an HTML string for relevant types.
    // No further adaptation needed here for content structure before sending to backend.
    // Backend is expected to handle the HTML string in the 'content' JSON field.
    mutation.mutate(formDataFromForm);
  };

  if (!courseId) return <div className="p-6">Invalid Course ID in URL.</div>;
  if (!moduleId && params.moduleId) return <div className="p-6">Invalid Module ID in URL.</div>;
  if (isLoadingModule) return <div className="p-6">Loading module data...</div>;
  if (fetchError && !existingModule) return <div className="p-6">Error loading module data. Please try again or go back.</div>;
  if (!existingModule) return <div className="p-6">Module data not available or module not found.</div>;


  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Link href={`/admin/training/courses/${courseId}`}>
          <Button variant="outline" size="icon" aria-label="Back to course modules">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Module: {existingModule?.title}</h1>
      </div>
      <ModuleForm
        courseId={courseId}
        moduleData={existingModule}
        onSubmit={handleSubmit}
        isSaving={mutation.isPending}
        mode="edit"
      />
    </div>
  );
};
export default EditModulePage;
