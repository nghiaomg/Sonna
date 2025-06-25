import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ServiceManager } from '@/services/serviceManager';
import type { Service } from '@/types';

interface VersionSelectorProps {
  serviceType: 'php' | 'nodejs';
  projectPath?: string;
  onVersionChange?: (version: string) => void;
}

export function VersionSelector({ serviceType, projectPath, onVersionChange }: VersionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [versions, setVersions] = useState<Service[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen, serviceType]);
  
  const loadVersions = async () => {
    setIsLoading(true);
    try {
      let versionsList: Service[] = [];
      
      if (serviceType === 'php') {
        versionsList = await ServiceManager.getPHPVersions();
      } else if (serviceType === 'nodejs') {
        versionsList = await ServiceManager.getNodeVersions();
      }
      
      setVersions(versionsList);
      
      // Set the default version
      const defaultVersion = versionsList.find(v => v.isDefault)?.version || versionsList[0]?.version;
      setSelectedVersion(defaultVersion || '');
    } catch (error) {
      console.error(`Failed to load ${serviceType} versions:`, error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleApply = async () => {
    setIsLoading(true);
    try {
      let success = false;
      
      if (projectPath) {
        // Set version for specific project
        if (serviceType === 'php') {
          success = await ServiceManager.setProjectPHPVersion(projectPath, selectedVersion);
        } else if (serviceType === 'nodejs') {
          success = await ServiceManager.setProjectNodeVersion(projectPath, selectedVersion);
        }
      } else {
        // Set default version
        if (serviceType === 'php') {
          success = await ServiceManager.setDefaultPHPVersion(selectedVersion);
        } else if (serviceType === 'nodejs') {
          success = await ServiceManager.setDefaultNodeVersion(selectedVersion);
        }
      }
      
      if (success && onVersionChange) {
        onVersionChange(selectedVersion);
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error(`Failed to set ${serviceType} version:`, error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getServiceName = () => {
    return serviceType === 'php' ? 'PHP' : 'Node.js';
  };
  
  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(true)}
        className="w-full"
      >
        {projectPath ? `Set ${getServiceName()} Version for Project` : `Set Default ${getServiceName()} Version`}
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select {getServiceName()} Version</DialogTitle>
            <DialogDescription>
              {projectPath 
                ? `Choose the ${getServiceName()} version to use for this project.` 
                : `Set the default ${getServiceName()} version for all projects.`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="version" className="text-right text-sm font-medium">
                Version
              </label>
              <Select
                value={selectedVersion}
                onValueChange={setSelectedVersion}
                disabled={isLoading || versions.length === 0}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={`Select ${getServiceName()} version`} />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((version) => (
                    <SelectItem 
                      key={version.version || ''}
                      value={version.version || ''}
                    >
                      {version.displayName} {version.isDefault ? '(Default)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApply} 
              disabled={isLoading || !selectedVersion}
            >
              {isLoading ? 'Applying...' : 'Apply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}