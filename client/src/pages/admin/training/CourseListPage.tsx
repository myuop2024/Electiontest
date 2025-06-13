import React, { useState, useEffect } from 'react';
import { Link }  from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle, BookOpen, Edit, Trash2 } from "lucide-react"; // Added Edit, Trash2
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
} from "@/components/ui/alert-dialog"; // Removed AlertDialogTrigger as it's not directly used here
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Course {
  id: number;
  title: string;
  description: string;
  targetAudience?: string | null;
  isActive: boolean;
  difficulty?: string | null;
}

const CourseListPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiRequest('GET', '/api/training/courses');
        if (!response.ok) {
          const errData = await response.json().catch(() => ({ error: `Failed to fetch courses: ${response.statusText}` }));
          throw new Error(errData.error || `Failed to fetch courses: ${response.statusText}`);
        }
        const data = await response.json();
        setCourses(data);
      } catch (err: any) {
        setError(err.message);
        toast({ title: "Error fetching courses", description: err.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, [toast, queryClient]); // Added queryClient to dependency array if it's used in a way that requires it, though not strictly for this fetch.

  const deleteMutation = useMutation({
    mutationFn: (courseId: number) => {
      return apiRequest('DELETE', `/api/training/courses/${courseId}`).then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error || 'Failed to delete course') });
        }
        if (res.status === 204) return;
        return res.json();
      });
    },
    onSuccess: () => {
      toast({ title: "Course Deleted", description: `Course "${courseToDelete?.title}" has been deleted.` });
      queryClient.invalidateQueries({ queryKey: ['/api/training/courses'] });
      setIsDeleteDialogOpen(false);
      setCourseToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: "Delete Error", description: error.message, variant: "destructive" });
      setIsDeleteDialogOpen(false);
      setCourseToDelete(null);
    }
  });

  const handleConfirmDelete = () => {
    if (courseToDelete) {
      deleteMutation.mutate(courseToDelete.id);
    }
  };

  const openDeleteDialog = (course: Course) => {
    setCourseToDelete(course);
    setIsDeleteDialogOpen(true);
  };

  if (isLoading) return <div className="p-6">Loading courses...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Courses</h1>
        </div>
        <Link href="/admin/training/courses/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Course
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Training Courses</CardTitle>
          <CardDescription>Manage all training courses available in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Target Audience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No courses found.
                  </TableCell>
                </TableRow>
              ) : (
                courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.title}</TableCell>
                    <TableCell>{course.targetAudience || 'N/A'}</TableCell>
                    <TableCell>{course.isActive ? 'Active' : 'Draft'}</TableCell>
                    <TableCell>{course.difficulty || 'N/A'}</TableCell>
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
                            <Link href={`/admin/training/courses/${course.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/training/courses/${course.id}`}> {/* Changed href here */}
                              <ListOrdered className="mr-2 h-4 w-4" />Manage Modules
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(course)}
                            className="text-red-600 hover:!text-red-600 focus:!text-red-600 focus:!bg-red-100"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />Delete
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
              This action cannot be undone. This will permanently delete the course "{courseToDelete?.title}"
              and all its associated modules, quizzes, and assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCourseToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Yes, delete course'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CourseListPage;
