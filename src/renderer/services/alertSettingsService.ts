import { DEFAULT_CAPTURE_ALERT_SETTINGS } from '../../shared/captureTypes.js';
import type {
  CaptureAlertSettings,
  CaptureRecord,
  PokemonQuality,
} from '../../shared/captureTypes.js';

const STORAGE_KEY = 'poke_idle_capture_alert_settings_v1';

export class AlertSettingsService {
  private static instance: AlertSettingsService | null = null;
  private settings: CaptureAlertSettings;
  private listeners: Set<(settings: CaptureAlertSettings) => void> = new Set();

  private constructor() {
    this.settings = this.loadFromStorage();
  }

  public static getInstance(): AlertSettingsService {
    if (!AlertSettingsService.instance) {
      AlertSettingsService.instance = new AlertSettingsService();
    }
    return AlertSettingsService.instance;
  }

  /**
   * Carrega as regras salvas do localStorage garantindo preenchimento de todas as 9 qualidades
   */
  private loadFromStorage(): CaptureAlertSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          const merged: CaptureAlertSettings = { ...DEFAULT_CAPTURE_ALERT_SETTINGS };
          for (const key of Object.keys(DEFAULT_CAPTURE_ALERT_SETTINGS) as PokemonQuality[]) {
            if (parsed[key] && typeof parsed[key] === 'object') {
              const rule = parsed[key];
              const enabled = typeof rule.enabled === 'boolean' ? rule.enabled : merged[key].enabled;
              const minIv =
                typeof rule.minIv === 'number' && !isNaN(rule.minIv)
                  ? Math.max(0, Math.min(192, Math.round(rule.minIv)))
                  : merged[key].minIv;
              merged[key] = { enabled, minIv };
            }
          }
          return merged;
        }
      }
    } catch (err) {
      console.warn('[AlertSettingsService] Falha ao recuperar configurações do localStorage:', err);
    }
    return JSON.parse(JSON.stringify(DEFAULT_CAPTURE_ALERT_SETTINGS));
  }

  /**
   * Retorna cópia das configurações atuais
   */
  public getSettings(): CaptureAlertSettings {
    return JSON.parse(JSON.stringify(this.settings));
  }

  /**
   * Valida e persiste novas regras no localStorage
   */
  public saveSettings(newSettings: CaptureAlertSettings): void {
    const validated: CaptureAlertSettings = { ...DEFAULT_CAPTURE_ALERT_SETTINGS };
    for (const key of Object.keys(DEFAULT_CAPTURE_ALERT_SETTINGS) as PokemonQuality[]) {
      const rule = newSettings[key] || DEFAULT_CAPTURE_ALERT_SETTINGS[key];
      const minIv = Math.max(0, Math.min(192, Math.round(Number(rule.minIv) || 0)));
      validated[key] = {
        enabled: Boolean(rule.enabled),
        minIv,
      };
    }

    this.settings = validated;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (err) {
      console.error('[AlertSettingsService] Erro ao gravar configurações no localStorage:', err);
    }

    this.notify();
  }

  /**
   * Restaura as recomendações padrões de fábrica
   */
  public resetToDefaults(): CaptureAlertSettings {
    const defaults = JSON.parse(JSON.stringify(DEFAULT_CAPTURE_ALERT_SETTINGS));
    this.saveSettings(defaults);
    return defaults;
  }

  /**
   * Verifica se uma captura atende aos critérios configurados para acionar o botão pulsante
   */
  public shouldTriggerAlert(record: CaptureRecord): boolean {
    if (!record || !record.quality) return false;
    const quality = record.quality.toLowerCase() as PokemonQuality;
    const rule = this.settings[quality];
    if (!rule || !rule.enabled) return false;

    const ivTotal = record.iv?.total ?? 0;
    return ivTotal >= rule.minIv;
  }

  /**
   * Assina atualizações em tempo real das configurações
   */
  public subscribe(listener: (settings: CaptureAlertSettings) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSettings());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const current = this.getSettings();
    for (const listener of this.listeners) {
      try {
        listener(current);
      } catch (err) {
        console.error('[AlertSettingsService] Erro em listener:', err);
      }
    }
  }
}
