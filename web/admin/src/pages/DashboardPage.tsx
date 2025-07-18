import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.username}!</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              View and edit your profile information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Username:</span> {user?.username}
              </p>
              <p className="text-sm">
                <span className="font-medium">Email:</span> {user?.email}
              </p>
              <p className="text-sm">
                <span className="font-medium">Role:</span> {user?.role}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>LLM Generate</CardTitle>
            <CardDescription>
              Generate backend code from frontend uploads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Upload your frontend code and let AI generate the backend API and database models.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your recent generation jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              No recent activity yet.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Quick actions to get you started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">1</span>
              </div>
              <div>
                <p className="font-medium">Upload Frontend Code</p>
                <p className="text-sm text-gray-600">
                  Upload your React/Vue/Angular frontend code or Bolt/v0 exports
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">2</span>
              </div>
              <div>
                <p className="font-medium">AI Analysis</p>
                <p className="text-sm text-gray-600">
                  Let AI analyze your frontend and generate backend requirements
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">3</span>
              </div>
              <div>
                <p className="font-medium">Generate & Deploy</p>
                <p className="text-sm text-gray-600">
                  Review and apply the generated backend code to your project
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;