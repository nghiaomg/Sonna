import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Square, Network, Edit, Check } from 'lucide-react';
import type { Service } from '@/types';
import { useLanguage } from '@/lib/language-context';
import { ServiceManager } from '@/services';
import { ServiceList } from './ServiceList';

interface ServiceControlProps {
  services: Service[];
  onServiceUpdate: (services: Service[]) => void;
  onPortSettingsClick: () => void;
  onInstallClick: () => void;
}

export const ServiceControl: React.FC<ServiceControlProps> = ({
  services,
  onServiceUpdate,
  onPortSettingsClick,
  onInstallClick
}) => {
  const { t } = useLanguage();
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Check if any service is running
  const hasRunningServices = useMemo(() => {
    return services.some(service => service.running);
  }, [services]);
  
  const handleToggleAllServices = async () => {
    if (hasRunningServices) {
      // Stop all services if any are running
      await ServiceManager.stopAllServices(services);
    } else {
      // Start all services if none are running
      await ServiceManager.startAllServices(services);
    }
    
    // Refresh services status
    const updatedServices = await ServiceManager.getServicesStatus(services);
    onServiceUpdate(updatedServices);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.serviceControl}</CardTitle>
        <CardDescription>
          {t.serviceControlDesc}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-2">
          <div className="flex space-x-4 mb-6">
            <Button 
              onClick={handleToggleAllServices} 
              variant={hasRunningServices ? "destructive" : "default"}
              className="flex items-center"
            >
              {hasRunningServices ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  {t.stopAll}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  {t.startAll}
                </>
              )}
            </Button>
            <Button onClick={onPortSettingsClick} variant="outline" className="flex items-center">
              <Network className="w-4 h-4 mr-2" />
              {t.portSettings}
            </Button>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setIsEditMode(!isEditMode)}
            className="flex items-center"
          >
            {isEditMode ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                {t.done}
              </>
            ) : (
              <>
                <Edit className="w-4 h-4 mr-2" />
                {t.edit}
              </>
            )}
          </Button>
        </div>

        <ServiceList 
          services={services} 
          onServiceUpdate={onServiceUpdate}
          onInstallClick={onInstallClick}
          isEditMode={isEditMode}
        />
      </CardContent>
    </Card>
  );
}; 