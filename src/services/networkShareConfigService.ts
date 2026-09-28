import { SystemType } from '../types/traveller';
import { SystemRegistryService } from './systemRegistryService';

export interface NetworkShareLocation {
  id: string;
  name: string;
  category: 'Master Sheet' | 'Test Data Copies' | 'Deviations & Acceptance' | 'Custom';
  path: string;
  description: string;
}

const STORAGE_KEY_NETWORK_SHARES = 'digital_traveller_network_share_configs_v2';

/**
 * Renishaw production network share paths
 */
export const DEFAULT_NETWORK_CONFIGS: Record<string, [NetworkShareLocation, NetworkShareLocation, NetworkShareLocation]> = {
  inVia: [
    {
      id: 'invia-master-sheet',
      name: 'Master Test Sheet (.xlsm)',
      category: 'Master Sheet',
      path: '\\\\renishaw.com\\global\\gb\\PLC\\SPD\\Data\\SPD_Data\\Operations\\Production\\Final Test\\Current Test Sheets\\InVia Final Test\\Digital Test Sheet PT-70046-12.xlsm',
      description: 'inVia master digital test sheet template PT-70046-12'
    },
    {
      id: 'invia-test-data',
      name: 'Final Test Data Copies (Laser & Grating)',
      category: 'Test Data Copies',
      path: '\\\\renishaw.com\\global\\gb\\PLC\\SPD\\Data\\SPD_Data\\Operations\\Production\\Test\\Final Test Data\\InVia\\000000_INLUX0726-11_CDC\\Internal data\\Digital Test Sheets\\',
      description: 'Saved test sheet copies for each laser and grating combination'
    },
    {
      id: 'invia-deviations-acceptance',
      name: 'Deviations & Test Acceptance Records',
      category: 'Deviations & Acceptance',
      path: '\\\\renishaw.com\\global\\gb\\PLC\\SPD\\Data\\SPD_Data\\Operations\\Production\\Final Test\\Current Test Sheets\\Minor Deviation Record.xlsm',
      description: 'Master Minor Deviation Record.xlsm & Test Acceptance Record.xlsm templates'
    }
  ],
  Virsa: [
    {
      id: 'virsa-master-sheet',
      name: 'Master Test Sheet (.xlsm)',
      category: 'Master Sheet',
      path: '\\\\renishaw.com\\global\\gb\\PLC\\SPD\\Data\\SPD_Data\\Operations\\Production\\Final Test\\Current Test Sheets\\VIRSA Test Sheets\\Virsa Test Sheet PT-70152-06.xlsm',
      description: 'Virsa master digital test sheet template PT-70152-06'
    },
    {
      id: 'virsa-test-data',
      name: 'Final Test Data Copies (Laser & Grating)',
      category: 'Test Data Copies',
      path: '\\\\renishaw.com\\global\\gb\\PLC\\SPD\\Data\\SPD_Data\\Operations\\Production\\Test\\Final Test Data\\Virsa\\000000_INLUX0726-11_CDC\\Internal data\\Digital Test Sheets\\',
      description: 'Saved Virsa test sheet copies for each laser and grating combination'
    },
    {
      id: 'virsa-deviations-acceptance',
      name: 'Deviations & Test Acceptance Records',
      category: 'Deviations & Acceptance',
      path: '\\\\renishaw.com\\global\\gb\\PLC\\SPD\\Data\\SPD_Data\\Operations\\Production\\Final Test\\Current Test Sheets\\VIRSA Minor Deviation Record.xlsm',
      description: 'VIRSA Minor Deviation Record.xlsm & VIRSA Test Acceptance Record.xlsm'
    }
  ],
  inLux: [
    {
      id: 'inlux-master-sheet',
      name: 'Master Test Sheet (.xlsm)',
      category: 'Master Sheet',
      path: '\\\\renishaw.com\\global\\gb\\PLC\\SPD\\Data\\SPD_Data\\Operations\\Production\\Final Test\\Current Test Sheets\\inLux Test Sheets\\inLux Test Sheet PT-70151.xlsm',
      description: 'inLux master digital test sheet template PT-70151 (whole system)'
    },
    {
      id: 'inlux-test-data',
      name: 'Final Test Data Copies (Whole System)',
      category: 'Test Data Copies',
      path: '\\\\renishaw.com\\global\\gb\\PLC\\SPD\\Data\\SPD_Data\\Operations\\Production\\Test\\Final Test Data\\inLux\\000000_INLUX0726-11_CDC\\Internal data\\Digital Test Sheets\\',
      description: 'Saved inLux test sheet copies for the whole system run'
    },
    {
      id: 'inlux-deviations-acceptance',
      name: 'Deviations & Test Acceptance Records',
      category: 'Deviations & Acceptance',
      path: '\\\\renishaw.com\\global\\gb\\PLC\\SPD\\Data\\SPD_Data\\Operations\\Production\\Final Test\\Current Test Sheets\\inLux Minor Deviation Record.xlsm',
      description: 'inLux Minor Deviation Record.xlsm & inLux Test Acceptance Record.xlsm'
    }
  ]
};

export class NetworkShareConfigService {
  /**
   * Helper to generate 3 default locations for any new custom system
   */
  static generateDefaultLocationsForCustomSystem(
    systemName: string
  ): [NetworkShareLocation, NetworkShareLocation, NetworkShareLocation] {
    const slug = systemName.replace(/\s+/g, '_');
    return [
      {
        id: `${slug}-master-sheet`,
        name: `${systemName} Master Test Sheet`,
        category: 'Master Sheet',
        path: `\\\\renishaw.com\\global\\gb\\PLC\\SPD\\Data\\SPD_Data\\Operations\\Production\\Final Test\\Current Test Sheets\\${slug} Test Sheets\\${slug} Test Sheet.xlsm`,
        description: `Master digital test sheet template for ${systemName}`
      },
      {
        id: `${slug}-test-data`,
        name: `${systemName} Final Test Data Copies`,
        category: 'Test Data Copies',
        path: `\\\\renishaw.com\\global\\gb\\PLC\\SPD\\Data\\SPD_Data\\Operations\\Production\\Test\\Final Test Data\\${slug}\\Internal data\\Digital Test Sheets\\`,
        description: `Saved test sheets directory for ${systemName}`
      },
      {
        id: `${slug}-deviations-acceptance`,
        name: `${systemName} Deviation & Acceptance Records`,
        category: 'Deviations & Acceptance',
        path: `\\\\renishaw.com\\global\\gb\\PLC\\SPD\\Data\\SPD_Data\\Operations\\Production\\Final Test\\Current Test Sheets\\${slug} Minor Deviation Record.xlsm`,
        description: `Minor Deviation and Test Acceptance copies saved to Internal data\\`
      }
    ];
  }

  /**
   * Load configurations for all systems
   */
  static getAllConfigs(): Record<string, [NetworkShareLocation, NetworkShareLocation, NetworkShareLocation]> {
    const registeredSystems = SystemRegistryService.getSystems();
    let configs: Record<string, [NetworkShareLocation, NetworkShareLocation, NetworkShareLocation]> = {};

    try {
      const stored = localStorage.getItem(STORAGE_KEY_NETWORK_SHARES);
      if (stored) {
        configs = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse network share configs from localStorage', e);
    }

    // Ensure built-in systems have defaults if missing
    Object.keys(DEFAULT_NETWORK_CONFIGS).forEach((sys) => {
      if (!configs[sys]) {
        configs[sys] = DEFAULT_NETWORK_CONFIGS[sys];
      }
    });

    // Ensure any custom added system has 3 configured locations
    registeredSystems.forEach((sys) => {
      if (!configs[sys]) {
        configs[sys] = this.generateDefaultLocationsForCustomSystem(sys);
      }
    });

    return configs;
  }

  /**
   * Get 3 configured network share locations for a specific system
   */
  static getLocationsForSystem(system: SystemType): [NetworkShareLocation, NetworkShareLocation, NetworkShareLocation] {
    const all = this.getAllConfigs();
    if (all[system]) return all[system];
    const newLocs = this.generateDefaultLocationsForCustomSystem(system);
    all[system] = newLocs;
    this.saveAllConfigs(all);
    return newLocs;
  }

  /**
   * Update one specific location for a system
   */
  static updateLocation(
    system: SystemType,
    index: 0 | 1 | 2,
    updates: Partial<NetworkShareLocation>
  ): Record<string, [NetworkShareLocation, NetworkShareLocation, NetworkShareLocation]> {
    const all = this.getAllConfigs();
    if (!all[system]) {
      all[system] = this.generateDefaultLocationsForCustomSystem(system);
    }
    all[system][index] = {
      ...all[system][index],
      ...updates
    };
    this.saveAllConfigs(all);
    return all;
  }

  /**
   * Save all configs at once
   */
  static saveAllConfigs(
    configs: Record<string, [NetworkShareLocation, NetworkShareLocation, NetworkShareLocation]>
  ): void {
    try {
      localStorage.setItem(STORAGE_KEY_NETWORK_SHARES, JSON.stringify(configs));
    } catch (e) {
      console.error('Failed to save network share configurations', e);
    }
  }

  /**
   * Reset configurations to default
   */
  static resetToDefaults(): Record<string, [NetworkShareLocation, NetworkShareLocation, NetworkShareLocation]> {
    try {
      localStorage.removeItem(STORAGE_KEY_NETWORK_SHARES);
    } catch (e) {
      console.error('Failed to reset network share configurations', e);
    }
    return this.getAllConfigs();
  }
}
