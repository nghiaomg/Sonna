import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Square, X, Copy, ChevronDown, ArrowDown, Power } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/language-context';

interface TitlebarProps {
  title?: string;
  className?: string;
}

export function Titlebar({ title = "Sonna", className }: TitlebarProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [showCloseMenu, setShowCloseMenu] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    // Check if window is maximized on mount
    if (window.electronAPI) {
      window.electronAPI.isWindowMaximized().then(setIsMaximized);
    }
  }, []);

  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
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
      await window.electronAPI.closeWindow();
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
        <img src="/logo.png" alt="Sonna" className="w-4 h-4" />
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
            className="h-8 w-12 rounded-none hover:bg-destructive hover:text-destructive-foreground no-drag p-0 flex items-center"
            onClick={() => setShowCloseMenu(!showCloseMenu)}
          >
            <ChevronDown className="w-3 h-3 mr-1" />
            <X className="w-4 h-4" />
          </Button>
          
          {showCloseMenu && (
            <div className="absolute right-0 top-8 bg-background border border-border rounded-md shadow-lg z-50 min-w-[180px] no-drag">
              <div className="py-1">
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted text-left"
                  onClick={handleHideToTray}
                >
                  <ArrowDown className="w-4 h-4" />
                  {t('hideToTray')}
                </button>
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-destructive hover:text-destructive-foreground text-left"
                  onClick={handleQuitApp}
                >
                  <Power className="w-4 h-4" />
                  {t('quitApp')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 