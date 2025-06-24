import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Square, Network } from 'lucide-react';
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
  
  const handleStartAll = async () => {
    await ServiceManager.startAllServices(services);
    // Refresh services status
    const updatedServices = await ServiceManager.getServicesStatus(services);
    onServiceUpdate(updatedServices);
  };
  
  const handleStopAll = async () => {
    await ServiceManager.stopAllServices(services);
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
        <div className="flex space-x-4 mb-6">
          <Button onClick={handleStartAll} className="flex items-center">
            <Play className="w-4 h-4 mr-2" />
            {t.startAll}
          </Button>
          <Button onClick={handleStopAll} variant="destructive" className="flex items-center">
            <Square className="w-4 h-4 mr-2" />
            {t.stopAll}
          </Button>
          <Button onClick={onPortSettingsClick} variant="outline" className="flex items-center">
            <Network className="w-4 h-4 mr-2" />
            {t.portSettings}
          </Button>
        </div>

        <ServiceList 
          services={services} 
          onServiceUpdate={onServiceUpdate}
          onInstallClick={onInstallClick}
        />
      </CardContent>
    </Card>
  );
}; 