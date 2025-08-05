import { useState } from 'react';
import { getConfigService, AppConfig } from '../services/configService';

export const useAppConfig = () => {
  const [config, setConfig] = useState<AppConfig>(() => {
    const configService = getConfigService();
    return configService.getConfig();
  });

  const configService = getConfigService();

  const updateConfig = (updates: Partial<AppConfig>) => {
    configService.updateConfig(updates);
    setConfig(configService.getConfig());
  };

  const setSiteName = (name: string) => {
    configService.setSiteName(name);
    setConfig(configService.getConfig());
  };

  const setSiteDescription = (description: string) => {
    configService.setSiteDescription(description);
    setConfig(configService.getConfig());
  };

  const resetToDefault = () => {
    configService.resetToDefault();
    setConfig(configService.getConfig());
  };

  return {
    config,
    updateConfig,
    setSiteName,
    setSiteDescription,
    resetToDefault,
    siteName: config.siteName,
    siteDescription: config.siteDescription,
    adminEmail: config.adminEmail,
    primaryColor: config.theme.primaryColor,
    isFeatureEnabled: (feature: keyof AppConfig['features']) => 
      configService.isFeatureEnabled(feature)
  };
};

export default useAppConfig;
