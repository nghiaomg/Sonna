import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Search, Plus } from 'lucide-react';
import type { Service } from '@/types';
import { useLanguage } from '@/lib/language-context';

interface ServiceSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableServices: Service[];
  onSelectService: (service: Service) => void;
}

export function ServiceSelectionDialog({
  open,
  onOpenChange,
  availableServices,
  onSelectService
}: ServiceSelectionDialogProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredServices = availableServices.filter(service => 
    service.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.selectService}</DialogTitle>
          <DialogDescription>
            {t.selectServiceDesc}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.searchServices}
              className="pl-8"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-1">
          {filteredServices.length > 0 ? (
            filteredServices.map(service => (
              <Button
                key={service.name}
                variant="outline"
                className="justify-start h-auto py-3 px-4"
                onClick={() => {
                  onSelectService(service);
                  onOpenChange(false);
                }}
              >
                <div className="flex items-center w-full">
                  <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 mr-3">
                    {service.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{service.displayName}</div>
                    <div className="text-xs text-muted-foreground">{service.name}</div>
                  </div>
                  <Plus className="ml-auto h-4 w-4" />
                </div>
              </Button>
            ))
          ) : (
            <div className="col-span-2 text-center py-8 text-muted-foreground">
              {t.noServicesFound}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 