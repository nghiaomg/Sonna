import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, X, Plus } from 'lucide-react';
import type { Service } from '@/types';
import { useLanguage } from '@/lib/language-context';
import { ServiceManager } from '@/services';
import { ServiceSelectionDialog } from './services/service-selection-dialog';

interface ServiceListProps {
  services: Service[];
  onServiceUpdate: (services: Service[]) => void;
  onInstallClick: () => void;
  isEditMode?: boolean;
}

export const ServiceList: React.FC<ServiceListProps> = ({
  services,
  onServiceUpdate,
  onInstallClick,
  isEditMode = false
}) => {
  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [emptySlotIndex, setEmptySlotIndex] = useState<number | null>(null);

  const availableServices: Service[] = [
    {
      name: 'apache',
      displayName: 'Apache',
      icon: <span>A</span>,
      running: false,
      installed: false
    },
    {
      name: 'mysql',
      displayName: 'MySQL',
      icon: <span>M</span>,
      running: false,
      installed: false
    },
    {
      name: 'nginx',
      displayName: 'Nginx',
      icon: <span>N</span>,
      running: false,
      installed: false
    },
    {
      name: 'php',
      displayName: 'PHP-FPM',
      icon: <span>P</span>,
      running: false,
      installed: false
    },
    {
      name: 'redis',
      displayName: 'Redis',
      icon: <span>R</span>,
      running: false,
      installed: false
    },
    {
      name: 'nodejs',
      displayName: 'Node.js',
      icon: <span>N</span>,
      running: false,
      installed: false
    },
    {
      name: 'mongodb',
      displayName: 'MongoDB',
      icon: <span>M</span>,
      running: false,
      installed: false
    },
    {
      name: 'postgresql',
      displayName: 'PostgreSQL',
      icon: <span>P</span>,
      running: false,
      installed: false
    }
  ];

  const handleToggleService = async (serviceName: string, isRunning: boolean) => {
    if (isEditMode) return; // Prevent toggling services in edit mode

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

  const handleRemoveService = (index: number) => {
    if (!isEditMode) return;

    const updatedServices = [...services];
    updatedServices.splice(index, 1);
    onServiceUpdate(updatedServices);
  };

  const handleAddService = (service: Service) => {
    if (emptySlotIndex !== null) {
      const updatedServices = [...services];
      updatedServices.splice(emptySlotIndex, 0, service);
      onServiceUpdate(updatedServices);
      setEmptySlotIndex(null);
    } else {
      onServiceUpdate([...services, service]);
    }
  };

  const handleAddClick = (index?: number) => {
    setEmptySlotIndex(index !== undefined ? index : null);
    setIsDialogOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service, index) => (
          <Card key={`${service.name}-${index}`} className="transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3 flex-1">
                  <div className={`p-2 rounded-md ${service.running && !isEditMode ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                    {service.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{service.displayName}</h3>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      {!isEditMode && (
                        <>
                          <span className={`inline-block w-2 h-2 rounded-full ${!service.installed ? 'bg-gray-400' :
                              service.running ? 'bg-green-500' : 'bg-red-500'
                            }`}></span>
                          <span>
                            {!service.installed ? t.notInstalled :
                              service.running ? t.running : t.stopped}
                          </span>
                          {service.port && service.running && (
                            <span>:{service.port}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isEditMode ? (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveService(index)}
                      className="h-8 w-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  ) : !service.installed ? (
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

        {isEditMode && (
          <Card className="border-dashed border-2 hover:border-primary/50 transition-all cursor-pointer" onClick={() => handleAddClick()}>
            <CardContent className="p-4 flex items-center justify-center h-full min-h-[100px]">
              <div className="flex flex-col items-center text-muted-foreground">
                <Plus className="w-8 h-8 mb-2" />
                <span>{t.addService}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ServiceSelectionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        availableServices={availableServices.filter(
          availableService => !services.some(s => s.name === availableService.name)
        )}
        onSelectService={handleAddService}
      />
    </>
  );
}; 