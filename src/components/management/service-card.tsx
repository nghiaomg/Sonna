import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Download, CheckCircle, Loader2, Code, Package, Database, Server, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/language-context';

interface ServiceVersion {
  value: string;
  label: string;
  description?: string;
  recommended?: boolean;
  installed: boolean;
}

interface ServiceCardProps {
  id: string;
  displayName: string;
  language: string;
  versions: ServiceVersion[];
  hasInstalled: boolean;
  hasMultipleVersions: boolean;
  progress?: {
    progress: number;
    status: 'downloading' | 'extracting' | 'setup' | 'completed' | 'error';
    message: string;
  } | null;
  onInstallClick: (serviceId: string) => void;
}

const getServiceIcon = (language: string) => {
  switch (language.toLowerCase()) {
    case 'php':
      return <Code className="w-5 h-5 text-purple-500" />;
    case 'nodejs':
      return <Code className="w-5 h-5 text-green-500" />;
    case 'mysql':
    case 'mariadb':
      return <Database className="w-5 h-5 text-blue-500" />;
    case 'apache':
    case 'nginx':
      return <Server className="w-5 h-5 text-orange-500" />;
    default:
      return <Package className="w-5 h-5 text-gray-500" />;
  }
};

const getProgressVariant = (status: string) => {
  switch (status) {
    case 'downloading':
      return 'default';
    case 'extracting':
      return 'warning';
    case 'setup':
      return 'success';
    default:
      return 'default';
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

export function ServiceCard({
  id,
  displayName,
  language,
  versions,
  hasInstalled,
  hasMultipleVersions,
  progress,
  onInstallClick
}: ServiceCardProps) {
  const { t } = useLanguage();
  const isDownloading = progress ? ['downloading', 'extracting', 'setup'].includes(progress.status) : false;
  const installedVersions = versions.filter(v => v.installed);
  const availableVersions = versions.filter(v => !v.installed);

  return (
    <Card className="group transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 border-2 hover:border-primary/20 hover:-translate-y-1">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header with Icon and Service Info */}
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 group-hover:from-primary/10 group-hover:to-primary/5 transition-colors duration-200">
              {getServiceIcon(language)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-lg">{displayName}</h3>
                {hasInstalled && (
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {t.installed || 'Installed'}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {hasMultipleVersions 
                  ? `${versions.length} ${t.versionsAvailable || 'versions available'}`
                  : `${t.version || 'Version'} ${versions[0]?.value}`
                }
              </p>
            </div>
          </div>

          {/* Installation Progress */}
          {progress && progress.status !== 'completed' && (
            <div className="space-y-3 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {progress.status === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  )}
                  <span className={cn("font-medium text-sm", getStatusColor(progress.status))}>
                    {progress.message}
                  </span>
                </div>
                {progress.status === 'downloading' && (
                  <span className="text-xs text-muted-foreground font-mono">
                    {progress.progress}%
                  </span>
                )}
              </div>
              
              {(progress.status === 'downloading' || progress.status === 'extracting' || progress.status === 'setup') && (
                <Progress
                  value={progress.status === 'downloading' ? progress.progress : 100}
                  variant={getProgressVariant(progress.status)}
                  className="h-2"
                />
              )}
            </div>
          )}

          {/* Success State */}
          {progress && progress.status === 'completed' && (
            <div className="space-y-3 p-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-medium text-sm text-green-700 dark:text-green-400">
                  {progress.message}
                </span>
              </div>
            </div>
          )}

          {/* Installed Versions */}
          {hasInstalled && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t.installedVersions || 'Installed Versions'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {installedVersions.map(version => (
                  <Badge 
                    key={version.value} 
                    variant="secondary"
                    className="text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  >
                    {version.value}
                    {version.recommended && (
                      <span className="ml-1 text-[10px] opacity-60">★</span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Available Versions Preview */}
          {availableVersions.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t.available || 'Available'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {availableVersions.slice(0, 3).map(version => (
                  <Badge 
                    key={version.value} 
                    variant="outline"
                    className="text-xs"
                  >
                    {version.value}
                    {version.recommended && (
                      <span className="ml-1 text-[10px] text-amber-500">★</span>
                    )}
                  </Badge>
                ))}
                {availableVersions.length > 3 && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    +{availableVersions.length - 3} {t.moreVersions || 'more'}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <Button
              onClick={() => onInstallClick(id)}
              disabled={isDownloading || availableVersions.length === 0}
              className="w-full transition-all duration-200 hover:scale-105"
              variant={hasInstalled ? "outline" : "default"}
              size="sm"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t.installing || 'Installing...'}
                </>
              ) : availableVersions.length === 0 ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t.allInstalled || 'All Installed'}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  {hasMultipleVersions && availableVersions.length > 1
                    ? `${t.install_button || 'Install'} ${displayName}`
                    : `${t.install_button || 'Install'} ${availableVersions[0]?.label || displayName}`
                  }
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 