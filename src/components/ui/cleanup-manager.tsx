import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/language-context';

interface Service {
  name: string;
  displayName: string;
  version: string;
  installed: boolean;
}

interface CleanupManagerProps {
  services: Service[];
  onServiceDeleted: (serviceName: string) => void;
}

export function CleanupManager({ services, onServiceDeleted }: CleanupManagerProps) {
  const { t } = useLanguage();
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [deletingServices, setDeletingServices] = useState<Set<string>>(new Set());
  const [lastCleanupResult, setLastCleanupResult] = useState<string | null>(null);

  const installedServices = services.filter(service => service.installed);

  const handleCleanupAll = async () => {
    if (window.electronAPI) {
      setIsCleaningUp(true);
      setLastCleanupResult(null);
      
      try {
        const result = await window.electronAPI.cleanupApplications();
        
        if (result.success) {
          setLastCleanupResult(`✅ ${result.message}`);
          // Notify parent that all services were deleted
          installedServices.forEach(service => onServiceDeleted(service.name));
        } else {
          setLastCleanupResult(`❌ ${result.message}`);
        }
      } catch (error) {
        setLastCleanupResult(`❌ Failed to cleanup: ${error}`);
      } finally {
        setIsCleaningUp(false);
      }
    }
  };

  const handleDeleteService = async (serviceName: string) => {
    if (window.electronAPI) {
      setDeletingServices(prev => new Set(prev.add(serviceName)));
      
      try {
        const result = await window.electronAPI.deleteService(serviceName);
        
        if (result.success) {
          onServiceDeleted(serviceName);
        } else {
          console.error(`Failed to delete ${serviceName}:`, result.message);
        }
      } catch (error) {
        console.error(`Failed to delete ${serviceName}:`, error);
      } finally {
        setDeletingServices(prev => {
          const newSet = new Set(prev);
          newSet.delete(serviceName);
          return newSet;
        });
      }
    }
  };

  const getTotalSize = () => {
    // Rough estimate of installed size
    return `~${installedServices.length * 150}MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          {t.applicationCleanup}
        </CardTitle>
        <CardDescription>
          {t.applicationCleanupDesc}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{t.installedServices}</h3>
                <p className="text-sm text-muted-foreground">
                  {installedServices.length} services • {t.estimatedSize}: {getTotalSize()}
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleCleanupAll}
                disabled={isCleaningUp || installedServices.length === 0}
                className="flex items-center gap-2"
              >
                {isCleaningUp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.cleaning}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    {t.cleanupAll}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Cleanup Result */}
          {lastCleanupResult && (
            <div className={cn(
              "p-3 rounded-lg text-sm",
              lastCleanupResult.startsWith('✅') 
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            )}>
              {lastCleanupResult}
            </div>
          )}

          {/* Individual Services */}
          {installedServices.length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-medium">{t.individualServices}</h4>
              {installedServices.map((service) => {
                const isDeleting = deletingServices.has(service.name);
                
                return (
                  <div key={service.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <div>
                        <h5 className="font-medium">{service.displayName}</h5>
                        <p className="text-sm text-muted-foreground">
                          Version {service.version} • Installed
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteService(service.name)}
                      disabled={isDeleting}
                      className="flex items-center gap-2 text-destructive hover:text-destructive"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                            {t.deleting}
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3 h-3" />
                            {t.delete}
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Trash2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h4 className="font-medium mb-2">{t.noServicesInstalled}</h4>
              <p className="text-sm">{t.noServicesInstalledDesc}</p>
            </div>
          )}

          {/* Warning */}
          {installedServices.length > 0 && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-700 dark:text-amber-400">{t.warning}</p>
                <p className="text-amber-600 dark:text-amber-300">
                  {t.warningMessage}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 