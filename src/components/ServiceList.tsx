import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { Service } from '@/types';
import { useLanguage } from '@/lib/language-context';
import { ServiceManager } from '@/services';

interface ServiceListProps {
  services: Service[];
  onServiceUpdate: (services: Service[]) => void;
  onInstallClick: () => void;
}

export const ServiceList: React.FC<ServiceListProps> = ({ 
  services, 
  onServiceUpdate,
  onInstallClick
}) => {
  const { t } = useLanguage();
  
  const handleToggleService = async (serviceName: string, isRunning: boolean) => {
    const success = await ServiceManager.toggleService(serviceName, isRunning);
    
    if (success) {
      const updatedServices = services.map(service => 
        service.name === serviceName 
          ? { ...service, running: !isRunning } 
          : service
      );
      onServiceUpdate(updatedServices);
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {services.map((service) => (
        <Card key={service.name} className="transition-all hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3 flex-1">
                <div className={`p-2 rounded-md ${service.running ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                  {service.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{service.displayName}</h3>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      !service.installed ? 'bg-gray-400' : 
                      service.running ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    <span>
                      {!service.installed ? t.notInstalled : 
                      service.running ? t.running : t.stopped}
                    </span>
                    {service.port && service.running && (
                      <span>:{service.port}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {!service.installed ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onInstallClick}
                    className="h-8 px-3"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    {t.install_button}
                  </Button>
                ) : service.running ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleToggleService(service.name, true)}
                    className="h-8 px-3"
                  >
                    {t.stop}
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleToggleService(service.name, false)}
                    className="h-8 px-3"
                  >
                    {t.start}
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