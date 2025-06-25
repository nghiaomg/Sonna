import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Folder } from 'lucide-react';
import type { Project } from '@/types';
import { useLanguage } from '@/lib/language-context';
import { ProjectList } from './ProjectList';
import { ProjectManager } from '@/services';

interface ProjectSectionProps {
  projects: Project[];
  wwwPath: string;
  isLoading: boolean;
  onRefresh: () => void;
}

export const ProjectSection: React.FC<ProjectSectionProps> = ({
  projects,
  wwwPath,
  isLoading,
  onRefresh
}) => {
  const { t } = useLanguage();

  const handleOpenWwwFolder = () => {
    ProjectManager.openProjectFolder(wwwPath);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t.localProjects}</CardTitle>
          <CardDescription>
            {t.localProjectsDesc}
          </CardDescription>
          <div className="flex items-center mt-2 text-sm">
            <span className="text-muted-foreground mr-2">WWW:</span>
            <span
              className="text-blue-500 hover:text-blue-700 hover:underline cursor-pointer flex items-center"
              onClick={handleOpenWwwFolder}
            >
              <Folder className="w-3 h-3 mr-1" />
              {wwwPath}
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? t.loading : t.refresh}
        </Button>
      </CardHeader>
      <CardContent>
        <ProjectList
          projects={projects}
          wwwPath={wwwPath}
          isLoading={isLoading}
          onRefresh={onRefresh}
        />
      </CardContent>
    </Card>
  );
}; 