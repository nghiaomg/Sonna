import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Clock, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/language-context';
import { VersionInstallDialog } from './version-install-dialog';
import { ServiceCard } from './service-card';

interface DownloadProgress {
  serviceName: string;
  progress: number;
  status: 'downloading' | 'extracting' | 'setup' | 'completed' | 'error' | 'starting';
  message: string;
}

interface QueueStatus {
  queueLength: number;
  activeInstallations: string[];
  maxConcurrent: number;
  queuedServices?: Array<{
    serviceName: string;
    displayName: string;
    priority: number;
  }>;
}

interface Service {
  name: string;
  displayName: string;
  version: string;
  installed: boolean;
  downloadUrl: string;
}

interface GroupedService {
  id: string;
  displayName: string;
  language: string;
  versions: Array<{
    value: string;
    label: string;
    description?: string;
    recommended?: boolean;
    installed: boolean;
  }>;
  hasInstalled: boolean;
  hasMultipleVersions: boolean;
}

interface DownloadManagerProps {
  services: Service[];
  onServiceInstalled: (serviceName: string) => void;
}

export function DownloadManager({ services, onServiceInstalled }: DownloadManagerProps) {
  const { t } = useLanguage();
  const [downloads, setDownloads] = useState<Map<string, DownloadProgress>>(new Map());
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({ queueLength: 0, activeInstallations: [], maxConcurrent: 3 });
  const [isInitialized, setIsInitialized] = useState(false);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<GroupedService | null>(null);

  useEffect(() => {
    initializeSonna();

    if (window.electronAPI) {
      const electronAPI = window.electronAPI as any;
      
      const handleDownloadProgress = (event: any, progress: DownloadProgress) => {
        setDownloads(prev => new Map(prev.set(progress.serviceName, progress)));

        if (progress.status === 'completed') {
          onServiceInstalled(progress.serviceName);
          
          setTimeout(() => {
            setDownloads(prev => {
              const newMap = new Map(prev);
              newMap.delete(progress.serviceName);
              return newMap;
            });
          }, 2000);
        } else if (progress.status === 'error') {
          setTimeout(() => {
            setDownloads(prev => {
              const newMap = new Map(prev);
              newMap.delete(progress.serviceName);
              return newMap;
            });
          }, 4000);
        }
      };

      const handleQueueStatus = (event: any, status: QueueStatus) => {
        setQueueStatus(status);
      };

      if (electronAPI.onDownloadProgress) {
        electronAPI.onDownloadProgress(handleDownloadProgress);
      }
      
      if (electronAPI.onInstallationQueueStatus) {
        electronAPI.onInstallationQueueStatus(handleQueueStatus);
      }

      if (electronAPI.getInstallationQueueStatus) {
        electronAPI.getInstallationQueueStatus().then(setQueueStatus).catch(() => {
          console.log('getInstallationQueueStatus not available');
        });
      }

      return () => {
        if (electronAPI?.removeDownloadProgressListener) {
          electronAPI.removeDownloadProgressListener(handleDownloadProgress);
        }
        if (electronAPI?.removeInstallationQueueStatusListener) {
          electronAPI.removeInstallationQueueStatusListener(handleQueueStatus);
        }
      };
    }
  }, [onServiceInstalled]);

  const initializeSonna = async () => {
    const electronAPI = window.electronAPI as any;
    if (electronAPI) {
      try {
        const result = await electronAPI.initializeSonna();
        if (result.success) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize Sonna:', error);
      }
    }
  };

  const groupedServices = React.useMemo((): GroupedService[] => {
    const groups = new Map<string, GroupedService>();

    services.forEach(service => {
      let language = '';
      let displayName = '';

      if (service.name.startsWith('php-')) {
        language = 'php';
        displayName = 'PHP';
      } else if (service.name.startsWith('nodejs-')) {
        language = 'nodejs'; 
        displayName = 'Node.js';
      } else {
        language = service.name;
        displayName = service.displayName || service.name;
      }

      if (!groups.has(language)) {
        groups.set(language, {
          id: language,
          displayName,
          language,
          versions: [],
          hasInstalled: false,
          hasMultipleVersions: false
        });
      }

      const group = groups.get(language)!;
      
      if (service.name.startsWith('php-') || service.name.startsWith('nodejs-')) {
        const version = service.name.split('-')[1];
        group.versions.push({
          value: version,
          label: `${displayName} ${version}`,
          description: `Version ${service.version}`,
          recommended: version === '8.3.0' || version === '20.11.0', 
          installed: service.installed
        });
      } else {
        group.versions.push({
          value: service.version,
          label: `${displayName} ${service.version}`,
          description: `Version ${service.version}`,
          recommended: true,
          installed: service.installed
        });
      }

      if (service.installed) {
        group.hasInstalled = true;
      }
    });

    groups.forEach(group => {
      group.hasMultipleVersions = group.versions.length > 1;
      group.versions.sort((a, b) => {
        if (a.recommended && !b.recommended) return -1;
        if (!a.recommended && b.recommended) return 1;
        return b.value.localeCompare(a.value, undefined, { numeric: true });
      });
    });

    return Array.from(groups.values());
  }, [services]);

  const handleInstallClick = (groupId: string) => {
    const group = groupedServices.find(g => g.id === groupId);
    if (!group) return;

    const availableVersions = group.versions.filter(v => !v.installed);
    
    if (availableVersions.length === 0) return;

    if (group.hasMultipleVersions && availableVersions.length > 1) {
      setSelectedService(group);
      setVersionDialogOpen(true);
    } else {
      const version = availableVersions[0];
      handleDirectInstall(group.language, version.value);
    }
  };

  const handleDirectInstall = async (serviceName: string, version: string) => {
    let fullServiceName = serviceName;
    if (serviceName === 'php' || serviceName === 'nodejs') {
      fullServiceName = `${serviceName}-${version}`;
    }

    const electronAPI = window.electronAPI as any;
    if (!electronAPI) {
      console.error('electronAPI is not available');
      return;
    }

    if (!electronAPI.downloadService) {
      console.error('downloadService method is not available on electronAPI');
      return;
    }

    try {
      setDownloads(prev => new Map(prev.set(fullServiceName, {
        serviceName: fullServiceName,
        progress: 0,
        status: 'downloading',
        message: t.preparingDownload || 'Preparing download...'
      })));

      const result = await electronAPI.downloadService(fullServiceName);
      console.log('Download service result:', result);
    } catch (error) {
      console.error(`Failed to download ${fullServiceName}:`, error);
      setDownloads(prev => new Map(prev.set(fullServiceName, {
        serviceName: fullServiceName,
        progress: 0,
        status: 'error',
        message: `${t.failedToDownload || 'Failed to download'}: ${error}`
      })));
    }
  };

  const handleVersionInstall = async (serviceName: string, version: string) => {
    await handleDirectInstall(serviceName, version);
  };

  const handleCancelInstallation = async (serviceName: string) => {
    const electronAPI = window.electronAPI as any;
    if (electronAPI?.cancelInstallation) {
      try {
        const result = await electronAPI.cancelInstallation(serviceName);
        if (result.success) {
          setDownloads(prev => {
            const newMap = new Map(prev);
            newMap.delete(serviceName);
            return newMap;
          });
        }
      } catch (error) {
        console.error('Failed to cancel installation:', error);
      }
    }
  };

  const getGroupProgress = (group: GroupedService) => {
    for (const version of group.versions) {
      const serviceName = group.hasMultipleVersions 
        ? `${group.language}-${version.value}`
        : group.language;
      const download = downloads.get(serviceName);
      if (download) {
        return {
          progress: download.progress,
          status: download.status as 'downloading' | 'extracting' | 'setup' | 'completed' | 'error',
          message: download.message
        };
      }
    }
    return null;
  };

  if (!isInitialized) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>{t.initializingSonna || 'Initializing Sonna...'}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {t.serviceInstallation || 'Service Installation'}
          </CardTitle>
          <CardDescription className="text-base">
            {t.serviceInstallationDesc || 'Install and manage development services for your local environment.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(queueStatus.queueLength > 0 || queueStatus.activeInstallations.length > 0) && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  Installation Queue Status
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                {queueStatus.activeInstallations.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin text-green-600" />
                    <span className="text-green-700 dark:text-green-300">
                      Installing: {queueStatus.activeInstallations.length}/{queueStatus.maxConcurrent} services
                    </span>
                  </div>
                )}
                
                {queueStatus.queueLength > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3 h-3 text-yellow-600" />
                    <span className="text-yellow-700 dark:text-yellow-300">
                      {queueStatus.queueLength} service(s) waiting in queue
                    </span>
                  </div>
                )}

                {queueStatus.queuedServices && queueStatus.queuedServices.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-muted-foreground mb-1">Queued services:</div>
                    <div className="flex flex-wrap gap-1">
                      {queueStatus.queuedServices.map((service) => (
                        <div
                          key={service.serviceName}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/50 rounded text-xs"
                        >
                          <span>{service.displayName}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-4 w-4 p-0 hover:bg-red-100 dark:hover:bg-red-900/50"
                            onClick={() => handleCancelInstallation(service.serviceName)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {groupedServices.map((group) => {
              const groupProgress = getGroupProgress(group);

              return (
                <ServiceCard
                  key={group.id}
                  id={group.id}
                  displayName={group.displayName}
                  language={group.language}
                  versions={group.versions}
                  hasInstalled={group.hasInstalled}
                  hasMultipleVersions={group.hasMultipleVersions}
                  progress={groupProgress}
                  onInstallClick={handleInstallClick}
                />
              );
            })}
          </div>

          {groupedServices.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg">
                No services available for installation.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedService && (
        <VersionInstallDialog
          open={versionDialogOpen}
          onOpenChange={setVersionDialogOpen}
          serviceName={selectedService.language}
          serviceDisplayName={selectedService.displayName}
          versions={selectedService.versions.filter(v => !v.installed)}
          onInstall={handleVersionInstall}
        />
      )}
    </>
  );
} 