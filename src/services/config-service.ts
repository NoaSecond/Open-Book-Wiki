// Service de configuration pour les paramètres globaux de l'application

export interface AppConfig {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  adminEmail: string;
  version: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
  };
  features: {
    userRegistration: boolean;
    darkMode: boolean;
    search: boolean;
  };
}

class ConfigService {
  private configKey = 'appConfig';
  private defaultConfig: AppConfig = {
    siteName: 'Open Book Wiki',
    siteDescription: 'Wiki open source',
    siteUrl: 'https://openbook.wiki',
    adminEmail: 'admin@openbook.wiki',
    version: '1.0.0',
    theme: {
      primaryColor: '#06b6d4',
      secondaryColor: '#3b82f6'
    },
    features: {
      userRegistration: false,
      darkMode: true,
      search: true
    }
  };

  /**
   * Obtient l'URL de base de l'API automatiquement
   */
  getApiBaseUrl(): string {
    const currentUrl = window.location;
    const protocol = currentUrl.protocol;
    const hostname = currentUrl.hostname;
    
    // En production, utilise le même domaine avec le port 3001
    // En développement, détecte automatiquement
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:3001`;
    } else {
      // En production, suppose que l'API est sur le même domaine mais port différent
      // ou sur un sous-domaine api.
      return `${protocol}//${hostname}:3001`;
    }
  }

  /**
   * Obtient l'URL complète pour un endpoint d'API
   */
  getApiUrl(endpoint: string): string {
    const baseUrl = this.getApiBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}/api${cleanEndpoint}`;
  }

  constructor() {
    this.initializeConfig();
  }

  private initializeConfig() {
    const existing = localStorage.getItem(this.configKey);
    if (!existing) {
      localStorage.setItem(this.configKey, JSON.stringify(this.defaultConfig));
      console.log('✅ Configuration par défaut initialisée');
    }
  }

  /**
   * Récupère la configuration complète
   */
  getConfig(): AppConfig {
    const stored = localStorage.getItem(this.configKey);
    return stored ? JSON.parse(stored) : this.defaultConfig;
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(updates: Partial<AppConfig>): void {
    const current = this.getConfig();
    const updated = { ...current, ...updates };
    localStorage.setItem(this.configKey, JSON.stringify(updated));
    console.log('✅ Configuration mise à jour:', updates);
  }

  /**
   * Récupère le nom du site
   */
  getSiteName(): string {
    return this.getConfig().siteName;
  }

  /**
   * Met à jour le nom du site
   */
  setSiteName(name: string): void {
    this.updateConfig({ siteName: name });
  }

  /**
   * Récupère la description du site
   */
  getSiteDescription(): string {
    return this.getConfig().siteDescription;
  }

  /**
   * Met à jour la description du site
   */
  setSiteDescription(description: string): void {
    this.updateConfig({ siteDescription: description });
  }

  /**
   * Récupère l'email admin
   */
  getAdminEmail(): string {
    return this.getConfig().adminEmail;
  }

  /**
   * Met à jour l'email admin
   */
  setAdminEmail(email: string): void {
    this.updateConfig({ adminEmail: email });
  }

  /**
   * Récupère la couleur primaire
   */
  getPrimaryColor(): string {
    return this.getConfig().theme.primaryColor;
  }

  /**
   * Met à jour la couleur primaire
   */
  setPrimaryColor(color: string): void {
    const config = this.getConfig();
    config.theme.primaryColor = color;
    this.updateConfig(config);
  }

  /**
   * Vérifie si une fonctionnalité est activée
   */
  isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.getConfig().features[feature];
  }

  /**
   * Active/désactive une fonctionnalité
   */
  toggleFeature(feature: keyof AppConfig['features'], enabled: boolean): void {
    const config = this.getConfig();
    config.features[feature] = enabled;
    this.updateConfig(config);
  }

  /**
   * Remet la configuration par défaut
   */
  resetToDefault(): void {
    localStorage.setItem(this.configKey, JSON.stringify(this.defaultConfig));
    console.log('✅ Configuration réinitialisée');
  }
}

// Instance singleton
let configServiceInstance: ConfigService | null = null;

export const getConfigService = (): ConfigService => {
  if (!configServiceInstance) {
    configServiceInstance = new ConfigService();
  }
  return configServiceInstance;
};

export default ConfigService;
