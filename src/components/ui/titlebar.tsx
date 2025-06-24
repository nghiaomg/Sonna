import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Square, X, Copy, ChevronDown, ArrowDown, Power } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/language-context';
import { getLogoPath } from '@/lib/asset-helper';

interface TitlebarProps {
  title?: string;
  className?: string;
}

export function Titlebar({ title = "Sonna", className }: TitlebarProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [showCloseMenu, setShowCloseMenu] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.isWindowMaximized().then(setIsMaximized);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      if (showCloseMenu) {
        setShowCloseMenu(false);
      }
    };

    if (showCloseMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showCloseMenu]);

  const handleMinimize = async () => {
    if (window.electronAPI) {
      await window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = async () => {
    if (window.electronAPI) {
      await window.electronAPI.maximizeWindow();
      const maximized = await window.electronAPI.isWindowMaximized();
      setIsMaximized(maximized);
    }
  };

  const handleClose = async () => {
    if (window.electronAPI) {
      // First check if any services are running
      const servicesStatus = await window.electronAPI.getServicesStatus();
      const hasRunningServices = Object.values(servicesStatus).some((service: any) => service.running);
      
      if (hasRunningServices) {
        // If services are running, hide to tray instead of closing
        await window.electronAPI.hideToTray();
      } else {
        // If no services are running, quit the app
        await window.electronAPI.quitApp();
      }
    }
  };

  const handleHideToTray = async () => {
    if (window.electronAPI) {
      await window.electronAPI.hideToTray();
    }
    setShowCloseMenu(false);
  };

  const handleQuitApp = async () => {
    if (window.electronAPI) {
      await window.electronAPI.quitApp();
    }
    setShowCloseMenu(false);
  };

  return (
    <div className={cn(
      "flex items-center justify-between h-8 bg-background border-b select-none",
      "drag-region relative z-50",
      className
    )}>
      {/* Left side - Logo and title */}
      <div className="flex items-center px-4 gap-2">
        <img src={getLogoPath()} alt="Sonna" className="w-4 h-4" />
        <span className="text-sm font-medium text-foreground">{title}</span>
      </div>

      {/* Right side - Window controls */}
      <div className="flex">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-12 rounded-none hover:bg-muted no-drag p-0"
          onClick={handleMinimize}
        >
          <Minus className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-12 rounded-none hover:bg-muted no-drag p-0"
          onClick={handleMaximize}
        >
          {isMaximized ? (
            <Copy className="w-3 h-3" />
          ) : (
            <Square className="w-3 h-3" />
          )}
        </Button>
        
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-12 rounded-none hover:bg-destructive hover:text-destructive-foreground no-drag p-0"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-6 rounded-none hover:bg-muted no-drag p-0 absolute right-12 top-0"
            onClick={() => setShowCloseMenu(!showCloseMenu)}
          >
            <ChevronDown className="w-3 h-3" />
          </Button>
          
          {showCloseMenu && (
            <div className="absolute right-0 top-8 bg-background border border-border rounded-md shadow-lg z-50 min-w-[180px] no-drag">
              <div className="py-1">
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted text-left"
                  onClick={handleHideToTray}
                >
                  <ArrowDown className="w-4 h-4" />
                  {t.hideToTray}
                </button>
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-destructive hover:text-destructive-foreground text-left"
                  onClick={handleQuitApp}
                >
                  <Power className="w-4 h-4" />
                  {t.quitApp}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 