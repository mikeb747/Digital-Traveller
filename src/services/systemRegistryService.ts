import { SystemType } from '../types/traveller';

const STORAGE_KEY_CUSTOM_SYSTEMS = 'digital_traveller_registered_systems_v1';

export const BUILT_IN_SYSTEMS: SystemType[] = ['inVia', 'Virsa', 'inLux'];

export class SystemRegistryService {
  /**
   * Get all registered systems (built-in + any custom added systems)
   */
  static getSystems(): SystemType[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_SYSTEMS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure built-in systems are always present and normalized
          const unique = new Set<string>();
          BUILT_IN_SYSTEMS.forEach(s => unique.add(s));
          parsed.forEach((s: string) => {
            if (typeof s === 'string' && s.trim()) {
              const trimmed = s.trim();
              const normalized = trimmed.toLowerCase() === 'invia' ? 'inVia' : trimmed;
              unique.add(normalized);
            }
          });
          return Array.from(unique);
        }
      }
    } catch (e) {
      console.warn('Failed to load registered systems', e);
    }
    return [...BUILT_IN_SYSTEMS];
  }

  /**
   * Register a new system type
   */
  static addSystem(newSystemName: string): SystemType[] {
    const trimmed = newSystemName.trim();
    if (!trimmed) return this.getSystems();

    const normalized = trimmed.toLowerCase() === 'invia' ? 'inVia' : trimmed;
    const currentSystems = this.getSystems();

    if (!currentSystems.some(s => s.toLowerCase() === normalized.toLowerCase())) {
      const updated = [...currentSystems, normalized];
      try {
        localStorage.setItem(STORAGE_KEY_CUSTOM_SYSTEMS, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save registered systems', e);
      }
      return updated;
    }
    return currentSystems;
  }

  /**
   * Check if system is one of the 3 original built-ins
   */
  static isBuiltIn(system: SystemType): boolean {
    return BUILT_IN_SYSTEMS.includes(system);
  }
}
