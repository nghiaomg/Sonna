import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { useLanguage } from '../../lib/language-context';

interface PhpMyAdminMigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMigrate: () => Promise<void>;
}

export function PhpMyAdminMigrationDialog({ 
  open, 
  onOpenChange, 
  onMigrate 
}: PhpMyAdminMigrationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const handleMigrate = async () => {
    setIsLoading(true);
    try {
      await onMigrate();
      onOpenChange(false);
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t.phpmyadmin_migration_title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="text-yellow-600 text-xl">⚠️</div>
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-2">
                  {t.phpmyadmin_migration_warning}
                </p>
                <p>
                  {t.phpmyadmin_migration_description}
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <strong>{t.phpmyadmin_migration_from}</strong> C:\sonna\www\phpmyadmin
            </p>
            <p className="text-sm text-gray-600">
              <strong>{t.phpmyadmin_migration_to}</strong> C:\sonna\applications\phpmyadmin
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              {t.phpmyadmin_migration_benefits}
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t.phpmyadmin_migration_skip}
          </Button>
          <Button
            onClick={handleMigrate}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading 
              ? t.phpmyadmin_migration_migrating
              : t.phpmyadmin_migration_migrate
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 