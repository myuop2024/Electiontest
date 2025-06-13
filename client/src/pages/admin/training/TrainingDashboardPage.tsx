import React from 'react';
import { Link } from 'wouter'; // Added import for Link
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BookOpen } from 'lucide-react';

const TrainingDashboardPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <BookOpen className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Training Management Dashboard</h1>
      </div>
      <p className="text-muted-foreground">
        Welcome to the Training Management Dashboard. From here, you can manage courses, modules, quizzes, assignments, and other training-related settings.
      </p>

      {/* Placeholder for future content, like stats or quick links */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Quick statistics and links will appear here in the future.</p>
          <p>
            <Link href="/admin/training/courses" className="text-primary hover:underline">
              Manage Courses
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainingDashboardPage;
