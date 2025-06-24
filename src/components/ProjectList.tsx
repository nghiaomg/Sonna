import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Folder, ExternalLink, Globe } from 'lucide-react';
import type { Project } from '@/types';
import { useLanguage } from '@/lib/language-context';
import { ProjectManager } from '@/services';

interface ProjectListProps {
  projects: Project[];
  wwwPath: string;
  isLoading: boolean;
  onRefresh: () => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ 
  projects, 
  wwwPath,
}) => {
  const { t } = useLanguage();
  
  const handleOpenFolder = (projectPath: string) => {
    ProjectManager.openProjectFolder(projectPath);
  };
  
  const handleOpenUrl = (url: string) => {
    ProjectManager.openProjectUrl(url);
  };
  
  // Get icon for project type
  const getProjectTypeIcon = (type: string) => {
    switch (type) {
      case 'wordpress':
        return <Globe className="w-5 h-5" />;
      case 'laravel':
        return <code className="w-5 h-5 text-red-500">L</code>;
      case 'php':
        return <code className="w-5 h-5 text-blue-500">P</code>;
      case 'node':
        return <code className="w-5 h-5 text-green-500">N</code>;
      default:
        return <Folder className="w-5 h-5" />;
    }
  };
  
  if (projects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>{t.noProjectsFound}</p>
        <p className="text-sm">{t.noProjectsFoundDesc}</p>
        <div 
          className="mt-4 text-sm bg-muted p-2 rounded text-center cursor-pointer text-blue-500 hover:text-blue-700 hover:underline"
          onClick={() => handleOpenFolder(wwwPath)}
        >
          {wwwPath}
        </div>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <Card key={project.name} className="transition-all hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3 flex-1">
                <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-800">
                  {getProjectTypeIcon(project.type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {project.url}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenFolder(project.path)}
                  title={t.openFolder}
                >
                  <Folder className="w-4 h-4" />
                </Button>
                {project.hasIndex && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenUrl(project.url)}
                    title={t.openInBrowser}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 