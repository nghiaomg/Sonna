import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Titlebar } from '@/components/ui/titlebar';
import { DownloadManager } from '@/components/ui/download-manager';
import { CleanupManager } from '@/components/ui/cleanup-manager';
import { Settings } from '@/components/ui/settings';
import { PortSettingsDialog } from '@/components/ui/port-settings-dialog';
import { Server, Database, Globe, Code, Download, Trash2, Settings as SettingsIcon, Moon, Sun } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { getLogoPath } from '@/lib/asset-helper';
import { ServiceManager, ProjectManager, ConfigManager } from '@/services';
import { ServiceControl, ProjectSection } from '@/components';
import type { Service, Project } from '@/types';

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
    loadServicesStatus();
    loadProjects();
    loadServiceConfigurations();
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
    setDownloadServices(servicesList);
  };

  // Handle service installation
  const handleServiceInstalled = (serviceName: string) => {
    setServices(prevServices =>
      prevServices.map(service =>
        service.name === serviceName ? { ...service, installed: true } : service
      )
    );
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
    <div className="min-h-screen bg-background">
      {/* Custom Titlebar */}
      <Titlebar title={`${t.appTitle} - ${t.appSubtitle}`} />
      
      {/* Header */}
      <header className="border-b bg-card">
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

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
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
      </main>
    </div>
  );
}

export default App;
