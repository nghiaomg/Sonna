import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Project } from '@/types';
import { useLanguage } from '@/lib/language-context';
import { ProjectList } from './ProjectList';

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
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t.localProjects}</CardTitle>
          <CardDescription>
            {t.localProjectsDesc}
          </CardDescription>
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