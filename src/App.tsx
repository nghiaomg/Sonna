import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Titlebar } from '@/components/layout';
import { DownloadManager, CleanupManager, PhpMyAdminMigrationDialog } from '@/components/management';
import { Settings, PortSettingsDialog } from '@/components/settings';
import { Server, Database, Globe, Code, Download, Trash2, Settings as SettingsIcon, Moon, Sun } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { getLogoPath } from '@/lib/asset-helper';
import { ServiceManager, ProjectManager, ConfigManager } from '@/services';
import { ServiceControl, ProjectSection } from '@/components';
import type { Service, Project } from '@/types';

// Declare global electron API
declare global {
  interface Window {
    electronAPI: {
      checkPhpMyAdminMigration: () => Promise<{ needsMigration: boolean }>;
      migratePhpMyAdmin: () => Promise<{ success: boolean; message: string }>;
      updateWebServerConfigs: () => Promise<{ success: boolean; message: string }>;
    };
  }
}

function App() {
  const { t } = useLanguage();
  
  // Services state
  const [services, setServices] = useState<Service[]>([
    { name: 'apache', displayName: 'Apache', icon: <Server className="w-5 h-5" />, running: false, port: 80, installed: false },
    { name: 'mysql', displayName: 'MySQL', icon: <Database className="w-5 h-5" />, running: false, port: 3306, installed: false },
    { name: 'nginx', displayName: 'Nginx', icon: <Globe className="w-5 h-5" />, running: false, port: 8080, installed: false },
    { name: 'php', displayName: 'PHP-FPM', icon: <Code className="w-5 h-5" />, running: false, installed: false },
    { name: 'redis', displayName: 'Redis', icon: <Database className="w-5 h-5" />, running: false, port: 6379, installed: false },
    { name: 'nodejs', displayName: 'Node.js', icon: <Code className="w-5 h-5" />, running: false, installed: false },
  ]);

  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [wwwPath, setWwwPath] = useState<string>('C:/sonna/www');
  const [projectsLoading, setProjectsLoading] = useState<boolean>(false);

  // UI state
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'install' | 'cleanup' | 'settings'>('services');
  const [portSettingsOpen, setPortSettingsOpen] = useState(false);
  const [downloadServices, setDownloadServices] = useState<any[]>([]);
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load initial data
  useEffect(() => {
    const initializeApp = async () => {
      // First, ensure Sonna is initialized
      try {
        const api = window.electronAPI as any;
        if (api && typeof api.initializeSonna === 'function') {
          console.log('Initializing Sonna from frontend...');
          const initResult = await api.initializeSonna();
          if (initResult.success) {
            console.log('Sonna initialized successfully from frontend');
          } else {
            console.error('Failed to initialize Sonna from frontend:', initResult.message);
          }
        } else {
          console.warn('initializeSonna not available, main process may still be starting...');
        }
      } catch (error) {
        console.error('Frontend initialization error:', error);
      }

      // Then load all other data
    loadServicesStatus();
    loadProjects();
    loadServiceConfigurations();
    checkPhpMyAdminMigration();
      
      // Auto-configure services on app load to handle all installation scenarios
      const autoConfigureServices = async () => {
        try {
          const api = window.electronAPI as any;
          if (api && typeof api.autoConfigureServices === 'function') {
            console.log('🔄 Running auto-configuration for installed services...');
            const configResult = await api.autoConfigureServices();
            
            if (configResult.success) {
              console.log('✅ Auto-configuration completed:', configResult.message);
              if (configResult.actions && configResult.actions.length > 0) {
                console.log('📋 Actions performed:', configResult.actions);
              }
              
              // Reload services status after configuration
              setTimeout(() => {
                loadServicesStatus();
              }, 1000);
            } else {
              console.error('❌ Auto-configuration failed:', configResult.message);
            }
          } else {
            console.warn('autoConfigureServices not available, skipping auto-configuration');
          }
        } catch (error) {
          console.error('Failed to run auto-configuration:', error);
        }
      };
      
      // Delay the auto-configuration to avoid conflicts with other initialization
      setTimeout(autoConfigureServices, 2000);
    };

    initializeApp();
  }, []);

  // Load services status
  const loadServicesStatus = async () => {
    const updatedServices = await ServiceManager.getServicesStatus(services);
    setServices(updatedServices);
  };

  // Load projects
  const loadProjects = async () => {
    setProjectsLoading(true);
    try {
      const result = await ProjectManager.getProjects();
      setProjects(result.projects);
      setWwwPath(result.wwwPath);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  };

  // Load service configurations
  const loadServiceConfigurations = async () => {
    const servicesList = await ConfigManager.getDownloadServices();
    console.log('Download services loaded:', servicesList);
    setDownloadServices(servicesList);
  };

  // Check if phpMyAdmin migration is needed
  const checkPhpMyAdminMigration = async (retryCount = 0) => {
    try {
      // Add safety check with limited retries
      if (window.electronAPI && typeof window.electronAPI.checkPhpMyAdminMigration === 'function') {
        const result = await window.electronAPI.checkPhpMyAdminMigration();
        if (result.needsMigration) {
          setMigrationDialogOpen(true);
        }
      } else if (retryCount < 5) {
        console.warn(`electronAPI.checkPhpMyAdminMigration not available, retry ${retryCount + 1}/5...`);
        // Limited retries to prevent infinite loop
        setTimeout(() => checkPhpMyAdminMigration(retryCount + 1), 1000);
      } else {
        console.warn('electronAPI.checkPhpMyAdminMigration not available after 5 retries, skipping migration check');
      }
    } catch (error) {
      console.error('Failed to check phpMyAdmin migration:', error);
    }
  };

  // Handle phpMyAdmin migration
  const handlePhpMyAdminMigration = async () => {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.migratePhpMyAdmin();
        if (result.success) {
          console.log('phpMyAdmin migrated successfully');
          // Reload services to reflect updated configuration
          await loadServicesStatus();
          await loadServiceConfigurations();
        } else {
          console.error('Migration failed:', result.message);
        }
      }
    } catch (error) {
      console.error('Failed to migrate phpMyAdmin:', error);
      throw error;
    }
  };

  // Handle manual web server configuration update
  const handleUpdateWebServerConfigs = async () => {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.updateWebServerConfigs();
        if (result.success) {
          console.log('Web server configurations updated successfully');
          // Reload services to reflect updated configuration
          await loadServicesStatus();
          await loadServiceConfigurations();
        } else {
          console.error('Configuration update failed:', result.message);
        }
      }
    } catch (error) {
      console.error('Failed to update web server configurations:', error);
    }
  };

  // Handle service installation
  const handleServiceInstalled = async (serviceName: string) => {
    // Update services state (for Services tab)
    setServices(prevServices =>
      prevServices.map(service =>
        service.name === serviceName ? { ...service, installed: true } : service
      )
    );

    // Update downloadServices state (for Install tab)
    setDownloadServices(prevServices =>
      prevServices.map(service =>
        service.name === serviceName ? { ...service, installed: true } : service
      )
    );

    // Reload service configurations to get fresh data
    try {
      await loadServiceConfigurations();
      await loadServicesStatus();
    } catch (error) {
      console.error('Failed to reload service configurations:', error);
    }
  };

  // Handle service deletion
  const handleServiceDeleted = (serviceName: string) => {
    setServices(prevServices =>
      prevServices.map(service =>
        service.name === serviceName ? { ...service, installed: false, running: false } : service
      )
    );
    setDownloadServices(prevServices =>
      prevServices.map(service =>
        service.name === serviceName ? { ...service, installed: false } : service
      )
    );
  };

  return (
    <div className="h-screen max-h-screen bg-background flex flex-col overflow-hidden">
      {/* Custom Titlebar */}
      <Titlebar title={`${t.appTitle} - ${t.appSubtitle}`} />
      
      {/* Header */}
      <header className="border-b bg-card flex-shrink-0">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <img src={getLogoPath()} alt="Sonna" className="w-8 h-8" />
            <h1 className="text-xl font-bold">{t.appTitle}</h1>
            <span className="text-sm text-muted-foreground">{t.appSubtitle}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button 
              variant={activeTab === 'services' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveTab('services')}
            >
              {t.services}
            </Button>
            <Button 
              variant={activeTab === 'install' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveTab('install')}
            >
              <Download className="w-4 h-4 mr-2" />
              {t.install}
            </Button>
            <Button 
              variant={activeTab === 'cleanup' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveTab('cleanup')}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t.cleanup}
            </Button>
            <Button 
              variant={activeTab === 'settings' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveTab('settings')}
            >
              <SettingsIcon className="w-4 h-4 mr-2" />
              {t.settings}
            </Button>
          </div>
        </div>
      </header>

      {/* Port Settings Dialog */}
      <PortSettingsDialog open={portSettingsOpen} onOpenChange={setPortSettingsOpen} />

      {/* phpMyAdmin Migration Dialog */}
      <PhpMyAdminMigrationDialog 
        open={migrationDialogOpen} 
        onOpenChange={setMigrationDialogOpen}
        onMigrate={handlePhpMyAdminMigration}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full p-6">
          <div className="max-w-6xl mx-auto h-full">
            <div className="h-full overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {activeTab === 'install' && (
            <DownloadManager 
              services={downloadServices}
              onServiceInstalled={handleServiceInstalled}
            />
          )}
          
          {activeTab === 'cleanup' && (
            <CleanupManager 
              services={downloadServices}
              onServiceDeleted={handleServiceDeleted}
            />
          )}
          
          {activeTab === 'settings' && (
            <Settings 
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
            />
          )}
          
          {activeTab === 'services' && (
            <>
              {/* Service Control Panel */}
              <ServiceControl
                services={services}
                onServiceUpdate={setServices}
                onPortSettingsClick={() => setPortSettingsOpen(true)}
                onInstallClick={() => setActiveTab('install')}
              />

              {/* Projects Section */}
              <ProjectSection
                projects={projects}
                wwwPath={wwwPath}
                isLoading={projectsLoading}
                onRefresh={loadProjects}
              />
              </>
            )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
