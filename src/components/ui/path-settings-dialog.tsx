import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Folder, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

interface PathSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPath: string;
  onSave: (path: string, moveFiles: boolean) => Promise<void>;
}

export function PathSettingsDialog({ open, onOpenChange, currentPath, onSave }: PathSettingsDialogProps) {
  const { t } = useLanguage();
  const [path, setPath] = useState(currentPath);
  const [showMoveConfirm, setShowMoveConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setPath(currentPath);
      setShowMoveConfirm(false);
      setError('');
    }
  }, [open, currentPath]);

  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPath(e.target.value);
  };

  const handleSelectFolder = async () => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.selectFolder();
        if (result && result !== '') {
          setPath(result);
        }
      } catch (error) {
        console.error('Failed to select folder:', error);
      }
    }
  };

  const handleSave = () => {
    // Validate path
    if (!path || path.trim() === '') {
      setError(t.pathRequired || 'Path is required');
      return;
    }

    // Check if path is different
    if (path !== currentPath) {
      setShowMoveConfirm(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleConfirmMove = async (moveFiles: boolean) => {
    setLoading(true);
    setError('');

    try {
      await onSave(path, moveFiles);
      setShowMoveConfirm(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save path:', error);
      setError(String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {!showMoveConfirm ? (
          <>
            <DialogHeader>
              <DialogTitle>{t.installPathSettings || "Installation Path Settings"}</DialogTitle>
              <DialogDescription>
                {t.installPathDesc || "Change the installation path for Sonna"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  {t.installPath || "Installation Path"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={path}
                    onChange={handlePathChange}
                    className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                    placeholder="C:/sonna"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleSelectFolder}
                    title={t.selectFolder || "Select Folder"}
                  >
                    <Folder className="h-4 w-4" />
                  </Button>
                </div>
                {error && (
                  <div className="text-sm text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t.cancel || "Cancel"}
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? t.saving || "Saving..." : t.save || "Save"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t.confirmPathChange || "Confirm Path Change"}</DialogTitle>
              <DialogDescription>
                {t.pathChangeConfirmDesc || "Do you want to move existing files to the new location?"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md text-amber-800 dark:text-amber-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                  <div>
                    <h4 className="font-medium">{t.changingPath || "Changing Installation Path"}</h4>
                    <p className="text-sm mt-1">
                      {t.changingPathDesc || "You are changing the installation path from:"}
                    </p>
                    <p className="text-sm font-medium mt-1">{currentPath}</p>
                    <p className="text-sm mt-1">{t.toNewPath || "To new path:"}</p>
                    <p className="text-sm font-medium mt-1">{path}</p>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>

            <DialogFooter className="flex-col space-y-2 sm:space-y-0">
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Button 
                  variant="outline" 
                  onClick={() => setShowMoveConfirm(false)}
                  className="sm:flex-1"
                  disabled={loading}
                >
                  {t.back || "Back"}
                </Button>
                <Button 
                  variant="default" 
                  onClick={() => handleConfirmMove(true)}
                  className="sm:flex-1"
                  disabled={loading}
                >
                  {loading ? t.moving || "Moving..." : t.moveFiles || "Move Files"}
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => handleConfirmMove(false)}
                  className="sm:flex-1"
                  disabled={loading}
                >
                  {t.dontMove || "Don't Move"}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 