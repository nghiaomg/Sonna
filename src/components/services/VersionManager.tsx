import { useState, useEffect } from 'react';
import { ServiceManager } from '@/services/serviceManager';
import type { Service } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { VersionSelector } from '@/components/services/version-selector';
import { Badge } from '@/components/ui/badge';

interface VersionManagerProps {
  serviceType: 'php' | 'nodejs';
}

export function VersionManager({ serviceType }: VersionManagerProps) {
  const [versions, setVersions] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadVersions();
  }, [serviceType, refreshKey]);

  const loadVersions = async () => {
    setIsLoading(true);
    try {
      let versionsList: Service[] = [];
      
      if (serviceType === 'php') {
        versionsList = await ServiceManager.getPHPVersions();
      } else if (serviceType === 'nodejs') {
        versionsList = await ServiceManager.getNodeVersions();
      }
      
      setVersions(versionsList);
    } catch (error) {
      console.error(`Failed to load ${serviceType} versions:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVersionChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleToggleService = async (serviceName: string, isRunning: boolean) => {
    try {
      await ServiceManager.toggleService(serviceName, isRunning);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error(`Failed to toggle ${serviceName}:`, error);
    }
  };

  const handleInstallService = async (serviceName: string) => {
    try {
      // This assumes the download service function is implemented elsewhere
      await window.electronAPI.downloadService(serviceName);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error(`Failed to install ${serviceName}:`, error);
    }
  };

  const getServiceName = () => {
    return serviceType === 'php' ? 'PHP' : 'Node.js';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{getServiceName()} Versions</h2>
        <VersionSelector 
          serviceType={serviceType} 
          onVersionChange={handleVersionChange}
        />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {versions.map((version) => (
            <Card key={version.name} className={version.isActive ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{version.displayName}</CardTitle>
                  <div className="space-x-1">
                    {version.isDefault && <Badge variant="outline">Default</Badge>}
                    {version.isActive && <Badge>Active</Badge>}
                  </div>
                </div>
                <CardDescription>Version {version.version}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p>Status: {version.installed ? (version.running ? 'Running' : 'Stopped') : 'Not Installed'}</p>
                  {version.installed && (
                    <p className="mt-1">
                      Path: {version.name.startsWith('php') 
                        ? `C:/sonna/applications/php/${version.version}` 
                        : `C:/sonna/applications/nodejs/${version.version}`}
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                {version.installed ? (
                  <Button 
                    variant={version.running ? "destructive" : "default"}
                    onClick={() => handleToggleService(version.name, version.running)}
                  >
                    {version.running ? 'Stop' : 'Start'}
                  </Button>
                ) : (
                  <Button 
                    variant="outline"
                    onClick={() => handleInstallService(version.name)}
                  >
                    Install
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
