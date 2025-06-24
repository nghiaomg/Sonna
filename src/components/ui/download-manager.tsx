import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/language-context';

interface DownloadProgress {
  serviceName: string;
  progress: number;
  status: 'downloading' | 'extracting' | 'setup' | 'completed' | 'error';
  message: string;
}

interface Service {
  name: string;
  displayName: string;
  version: string;
  installed: boolean;
  downloadUrl: string;
}

interface DownloadManagerProps {
  services: Service[];
  onServiceInstalled: (serviceName: string) => void;
}

export function DownloadManager({ services, onServiceInstalled }: DownloadManagerProps) {
  const { t } = useLanguage();
  const [downloads, setDownloads] = useState<Map<string, DownloadProgress>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize Sonna on component mount
    initializeSonna();

    // Listen for download progress
    if (window.electronAPI) {
      window.electronAPI.onDownloadProgress((event: any, progress: DownloadProgress) => {
        setDownloads(prev => new Map(prev.set(progress.serviceName, progress)));
        
        if (progress.status === 'completed') {
          onServiceInstalled(progress.serviceName);
        }
      });
    }
  }, [onServiceInstalled]);

  const initializeSonna = async () => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.initializeSonna();
        if (result.success) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize Sonna:', error);
      }
    }
  };

  const handleDownload = async (serviceName: string) => {
    if (window.electronAPI) {
      try {
        // Set initial download state
        setDownloads(prev => new Map(prev.set(serviceName, {
          serviceName,
          progress: 0,
          status: 'downloading',
          message: t.preparingDownload
        })));

        await window.electronAPI.downloadService(serviceName);
      } catch (error) {
        console.error(`Failed to download ${serviceName}:`, error);
        setDownloads(prev => new Map(prev.set(serviceName, {
          serviceName,
          progress: 0,
          status: 'error',
          message: `${t.failedToDownload}: ${error}`
        })));
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'downloading':
      case 'extracting':
      case 'setup':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Download className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'downloading':
        return 'text-blue-600';
      case 'extracting':
        return 'text-orange-600';
      case 'setup':
        return 'text-purple-600';
      default:
        return 'text-muted-foreground';
    }
  };

  if (!isInitialized) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>{t.initializingSonna}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.serviceInstallation}</CardTitle>
        <CardDescription>
          {t.serviceInstallationDesc}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
                  {services.map((service) => {
          const download = downloads.get(service.name);
          const isDownloading = download && ['downloading', 'extracting', 'setup'].includes(download.status);
          const isCompleted = service.installed || download?.status === 'completed';
            
            return (
              <div key={service.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(download?.status || '')}
                    <div>
                      <h3 className="font-medium">{service.displayName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Version {service.version}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 flex-1">
                  {download && (
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className={cn("font-medium", getStatusColor(download.status))}>
                          {download.message}
                        </span>
                        {download.status === 'downloading' && (
                          <span className="text-muted-foreground">
                            {download.progress}%
                          </span>
                        )}
                      </div>
                                             {(download.status === 'downloading' || download.status === 'extracting' || download.status === 'setup') && (
                         <Progress 
                           value={download.status === 'downloading' ? download.progress : 100} 
                           className="h-2"
                         />
                       )}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {isCompleted ? (
                    <span className="text-green-600 font-medium flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {t.installed}
                    </span>
                  ) : (
                    <Button
                      onClick={() => handleDownload(service.name)}
                      disabled={isDownloading}
                      size="sm"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t.installing}
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          {t.install_button}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 