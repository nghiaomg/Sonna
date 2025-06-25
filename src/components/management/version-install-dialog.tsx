import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

interface VersionOption {
  value: string;
  label: string;
  description?: string;
  recommended?: boolean;
}

interface VersionInstallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceName: string;
  serviceDisplayName: string;
  versions: VersionOption[];
  onInstall: (serviceName: string, version: string) => Promise<void>;
}

export function VersionInstallDialog({
  open,
  onOpenChange,
  serviceName,
  serviceDisplayName,
  versions,
  onInstall
}: VersionInstallDialogProps) {
  const { t } = useLanguage();
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [isInstalling, setIsInstalling] = useState(false);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedVersion('');
      setIsInstalling(false);
      
      // Select recommended version by default
      const recommended = versions.find(v => v.recommended);
      if (recommended) {
        setSelectedVersion(recommended.value);
      } else if (versions.length > 0) {
        setSelectedVersion(versions[0].value);
      }
    }
  }, [open, versions]);

  const handleInstall = async () => {
    if (!selectedVersion) return;

    setIsInstalling(true);
    
    onOpenChange(false);
    
    try {
      await onInstall(serviceName, selectedVersion);
    } catch (error) {
      console.error('Installation failed:', error);
    }
  };

  const handleCancel = () => {
    if (!isInstalling) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Download className="w-5 h-5" />
            Install {serviceDisplayName}
          </DialogTitle>
          <DialogDescription>
            Choose a version of {serviceDisplayName} to install.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="version-select" className="text-sm font-medium">
              Select Version
            </label>
            <Select value={selectedVersion} onValueChange={setSelectedVersion}>
              <SelectTrigger id="version-select">
                <SelectValue placeholder="Choose a version" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((version) => (
                  <SelectItem key={version.value} value={version.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{version.label}</span>
                      {version.recommended && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Recommended
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isInstalling}
          >
            Cancel
          </Button>
          <Button
            onClick={handleInstall}
            disabled={!selectedVersion || isInstalling}
          >
            <Download className="w-4 h-4 mr-2" />
            {isInstalling ? 'Installing...' : `Install ${selectedVersion}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
