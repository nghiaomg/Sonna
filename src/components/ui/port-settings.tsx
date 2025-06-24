import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Server, Database, Globe } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

interface PortConfig {
  name: string;
  displayName: string;
  port: number;
  defaultPort: number;
  icon: React.ReactNode;
}

interface PortSettingsProps {
  onPortChange: (serviceName: string, port: number) => Promise<void>;
}

export function PortSettings({ onPortChange }: PortSettingsProps) {
  const { t } = useLanguage();
  const [services, setServices] = useState<PortConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | '' }>({ text: '', type: '' });

  useEffect(() => {
    loadServiceConfigurations();
  }, []);

  const loadServiceConfigurations = async () => {
    if (window.electronAPI) {
      try {
        const configResult = await window.electronAPI.getSonnaConfig();
        if (configResult.success && configResult.config) {
          // Filter only services with ports
          const portServices: PortConfig[] = [];
          
          const { apache, nginx, mysql, mongodb, redis } = configResult.config.services;
          
          if (apache) {
            portServices.push({
              name: apache.name,
              displayName: apache.displayName,
              port: apache.port || 80,
              defaultPort: 80,
              icon: <Server className="w-5 h-5" />
            });
          }
          
          if (nginx) {
            portServices.push({
              name: nginx.name,
              displayName: nginx.displayName,
              port: nginx.port || 8080,
              defaultPort: 8080,
              icon: <Globe className="w-5 h-5" />
            });
          }
          
          if (mysql) {
            portServices.push({
              name: mysql.name,
              displayName: mysql.displayName,
              port: mysql.port || 3306,
              defaultPort: 3306,
              icon: <Database className="w-5 h-5" />
            });
          }
          
          if (mongodb) {
            portServices.push({
              name: mongodb.name,
              displayName: mongodb.displayName,
              port: mongodb.port || 27017,
              defaultPort: 27017,
              icon: <Database className="w-5 h-5" />
            });
          }
          
          if (redis) {
            portServices.push({
              name: redis.name,
              displayName: redis.displayName,
              port: redis.port || 6379,
              defaultPort: 6379,
              icon: <Database className="w-5 h-5" />
            });
          }
          
          setServices(portServices);
        }
      } catch (error) {
        console.error('Failed to load service configurations:', error);
      }
    }
  };

  const handlePortChange = (serviceName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const newPort = parseInt(e.target.value, 10);
    
    setServices(prevServices => 
      prevServices.map(service => 
        service.name === serviceName ? { ...service, port: newPort } : service
      )
    );
  };

  const handleSavePort = async (serviceName: string) => {
    const service = services.find(s => s.name === serviceName);
    if (!service) return;
    
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      await onPortChange(serviceName, service.port);
      setMessage({ text: `${service.displayName} port updated successfully`, type: 'success' });
      
      // Reload services after short delay
      setTimeout(() => {
        loadServiceConfigurations();
      }, 1000);
    } catch (error) {
      console.error(`Failed to update ${serviceName} port:`, error);
      setMessage({ text: `Failed to update port: ${error}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPort = (serviceName: string) => {
    const service = services.find(s => s.name === serviceName);
    if (!service) return;
    
    setServices(prevServices => 
      prevServices.map(s => 
        s.name === serviceName ? { ...s, port: s.defaultPort } : s
      )
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            {t.portSettings || "Port Settings"}
          </CardTitle>
          <CardDescription>
            {t.portSettingsDesc || "Configure ports for services"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message.text && (
            <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
              {message.text}
            </div>
          )}
          
          <div className="space-y-4">
            {services.map((service) => (
              <div key={service.name} className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-800">
                    {service.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{service.displayName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t.defaultPort || "Default"}: {service.defaultPort}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={service.port}
                    onChange={(e) => handlePortChange(service.name, e)}
                    className="w-24 px-3 py-1 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                    min="1"
                    max="65535"
                  />
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleResetPort(service.name)}
                  >
                    {t.reset || "Reset"}
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleSavePort(service.name)}
                    disabled={loading}
                  >
                    {t.save || "Save"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 