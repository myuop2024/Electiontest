import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle, BookOpen, ChevronLeft, Edit, Trash2, ListOrdered } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient as useTanstackQueryClient } from '@tanstack/react-query';

interface Course {
  id: number;
  title: string;
  description: string;
  targetAudience?: string | null;
  isActive: boolean;
  difficulty?: string | null;
}

interface Module {
  id: number;
  courseId: number;
  title: string;
  description?: string | null;
  type: string;
  moduleOrder: number;
  isRequired: boolean;
  duration?: number | null;
}

const CourseDetailPage: React.FC = () => {
  const params = useParams();
  const courseId = params.courseId ? parseInt(params.courseId) : null;
  const { toast } = useToast();
  const queryClient = useTanstackQueryClient();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null);

  const { data: course, isLoading: isLoadingCourse, error: courseError } = useQuery<Course>({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error("Course ID is missing.");
      const response = await apiRequest('GET', `/api/training/courses/${courseId}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Failed to fetch course details' }));
        throw new Error(errData.error || 'Failed to fetch course details');
      }
      return response.json();
    },
    enabled: !!courseId,
  });

  const { data: modules, isLoading: isLoadingModules, error: modulesError } = useQuery<Module[]>({
    queryKey: ['courseModules', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error("Course ID is missing.");
      const response = await apiRequest('GET', `/api/training/courses/${courseId}/modules`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Failed to fetch modules' }));
        throw new Error(errData.error || 'Failed to fetch modules');
      }
      return response.json();
    },
    enabled: !!courseId,
  });

  useEffect(() => {
    if (courseError) toast({ title: "Error fetching course", description: (courseError as Error).message, variant: "destructive" });
    if (modulesError) toast({ title: "Error fetching modules", description: (modulesError as Error).message, variant: "destructive" });
  }, [courseError, modulesError, toast]);

  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId: number) => {
      return apiRequest('DELETE', `/api/training/modules/${moduleId}`).then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error || 'Failed to delete module') });
        }
        if (res.status === 204) return;
        return res.json();
      });
    },
    onSuccess: () => {
      toast({ title: "Module Deleted", description: `Module "${moduleToDelete?.title}" has been successfully deleted.` });
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: ['courseModules', courseId] });
      }
      setIsDeleteDialogOpen(false);
      setModuleToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: "Delete Error", description: error.message, variant: "destructive" });
      setIsDeleteDialogOpen(false);
      setModuleToDelete(null);
    }
  });

  const handleConfirmDelete = () => {
    if (moduleToDelete) {
      deleteModuleMutation.mutate(moduleToDelete.id);
    }
  };

  const openDeleteDialog = (module: Module) => {
    setModuleToDelete(module);
    setIsDeleteDialogOpen(true);
  };

  if (!courseId && !params.courseId) return <div className="p-6 text-red-500">Invalid Course ID in URL.</div>;
  if (isLoadingCourse || isLoadingModules) return <div className="p-6">Loading course and module data...</div>;
  if (courseError) return <div className="p-6 text-red-600">Error loading course: {(courseError as Error).message}</div>;
  if (!course) return <div className="p-6">Course not found.</div>;

  const sortedModules = modules?.sort((a, b) => a.moduleOrder - b.moduleOrder) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Link href="/admin/training/courses">
          <Button variant="outline" size="icon" aria-label="Back to courses">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <BookOpen className="h-8 w-8 text-primary" />
        <div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="text-muted-foreground">{course.description}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Modules</CardTitle>
            <CardDescription>Manage modules for this course. Reordering UI via POST to /api/training/courses/{courseId}/reorder-modules.</CardDescription>
          </div>
          <Link href={`/admin/training/courses/${courseId}/modules/new`}>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Module
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Order</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Duration (min)</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedModules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No modules found for this course.
                  </TableCell>
                </TableRow>
              ) : (
                sortedModules.map((module) => (
                  <TableRow key={module.id}>
                    <TableCell>
                        <ListOrdered className="h-5 w-5 text-muted-foreground mr-2 inline-block"/>
                        {module.moduleOrder}
                    </TableCell>
                    <TableCell className="font-medium">{module.title}</TableCell>
                    <TableCell>{module.type}</TableCell>
                    <TableCell>{module.isRequired ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{module.duration || 'N/A'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/training/courses/${courseId}/modules/${module.id}/edit`}>
                               <Edit className="mr-2 h-4 w-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(module)}
                            className="text-red-600 hover:!text-red-600 focus:!text-red-600 focus:!bg-red-100"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the module titled "{moduleToDelete?.title}".
              Any quizzes or assignments directly linked ONLY to this module might also be affected based on database cascade rules.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setModuleToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteModuleMutation.isPending}
            >
              {deleteModuleMutation.isPending ? 'Deleting...' : 'Yes, delete module'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CourseDetailPage;
