/**
 * WiRE Key Generation Service
 * Interfaces with https://spd-apps/FeaturePermissions/generate
 *
 * Request format:
 * POST https://spd-apps/FeaturePermissions/generate
 * Content-Type: application/x-www-form-urlencoded
 * Body: sn=<serialNumber>
 *
 * Response: HTML containing:
 * <p id="phrase">GVU7TA-JXR7EH-4CLA3W-36DS4G</p>
 */

export interface WireKeyResult {
  key: string;
  source: 'live' | 'proxy' | 'offline_fallback';
  rawResponse?: string;
  timestamp: string;
}

export class WireKeyService {
  /**
   * Deterministic Renishaw WiRE Key generator fallback
   * Used when spd-apps internal server is inaccessible from non-Renishaw intranet or offline test benches.
   * Produces authentic Renishaw 4x6 phrase format: XXXXXX-XXXXXX-XXXXXX-XXXXXX
   */
  static generateDeterministicKey(serialNumber: string): string {
    const cleanSn = serialNumber.trim().toUpperCase();
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // base32 without ambiguous 0/O/1/I
    let hash = 0x811c9dc5;

    for (let i = 0; i < cleanSn.length; i++) {
      hash ^= cleanSn.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }

    const segments: string[] = [];
    for (let seg = 0; seg < 4; seg++) {
      let segStr = '';
      for (let c = 0; c < 6; c++) {
        hash = Math.imul(hash ^ (seg * 17 + c * 31), 0x5bd1e995);
        const charIdx = Math.abs(hash) % chars.length;
        segStr += chars[charIdx];
      }
      segments.push(segStr);
    }
    return segments.join('-');
  }

  /**
   * Robust HTML parser that extracts <p id="phrase">KEY</p> using DOMParser
   */
  static extractPhraseFromHtml(htmlText: string): string | null {
    if (!htmlText) return null;

    try {
      // 1. Primary parser: DOMParser (Native browser HTML parser, no regex fragility)
      if (typeof window !== 'undefined' && window.DOMParser) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        const phraseEl = doc.getElementById('phrase');
        if (phraseEl && phraseEl.textContent) {
          const extracted = phraseEl.textContent.trim();
          if (extracted) return extracted;
        }

        // Secondary query selector check (case-insensitive id or attribute)
        const queryEl = doc.querySelector('#phrase, p[id="phrase"], [id="phrase"]');
        if (queryEl && queryEl.textContent) {
          const extracted = queryEl.textContent.trim();
          if (extracted) return extracted;
        }
      }
    } catch (e) {
      console.warn('DOMParser failed to parse HTML response', e);
    }

    // 2. Fallback regex in case DOMParser strips or is restricted
    const match = htmlText.match(/<p\s+[^>]*id=["']phrase["'][^>]*>([\s\S]*?)<\/p>/i);
    if (match && match[1]) {
      return match[1].replace(/<[^>]+>/g, '').trim();
    }

    // 3. Fallback for tag-less or JSON response if server changed format
    const phraseAttrMatch = htmlText.match(/"phrase"\s*:\s*"([A-Z0-9-]+)"/i);
    if (phraseAttrMatch && phraseAttrMatch[1]) {
      return phraseAttrMatch[1].trim();
    }

    return null;
  }

  /**
   * Core function required by specification: GetWireKey(serialNumber)
   *
   * Accepts a serial number string.
   * Performs the authenticated POST request as the browser.
   * Sends: sn=<serialNumber>
   * Receives HTML response.
   * Extracts <p id="phrase">KEY_HERE</p>.
   * Returns only the generated key.
   */
  static async GetWireKey(serialNumber: string): Promise<string> {
    const cleanSn = (serialNumber || '').trim();

    if (!cleanSn) {
      throw new Error('Empty serial number. Please provide a valid instrument serial number.');
    }

    // Prepare x-www-form-urlencoded body
    const formData = new URLSearchParams();
    formData.append('sn', cleanSn);

    const endpoints = [
      // 1. Direct intranet HTTPS URL (will succeed on Renishaw local intranet / company network with existing browser session)
      'https://spd-apps/FeaturePermissions/generate',
      // 2. Direct HTTP variant if intranet certificates are local
      'http://spd-apps/FeaturePermissions/generate',
      // 3. Local Vite dev proxy fallback if running inside applet
      '/api/feature-permissions/generate'
    ];

    let lastError: Error | null = null;
    let authFailed = false;

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          body: formData.toString(),
          credentials: 'include', // Automatically reuses existing Windows user session / company SSO / cookies
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.status === 401 || response.status === 403) {
          authFailed = true;
          throw new Error(
            `Authentication failure (HTTP ${response.status}). Your session or company permissions may have expired on spd-apps.`
          );
        }

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }

        const htmlText = await response.text();
        const extractedKey = this.extractPhraseFromHtml(htmlText);

        if (extractedKey) {
          return extractedKey;
        } else {
          throw new Error('Key phrase not found in HTML response (<p id="phrase"> missing or empty).');
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          lastError = new Error('Network timeout: spd-apps did not respond within 7 seconds.');
        } else {
          lastError = err;
        }

        if (authFailed) {
          // Authentication error is definitive, stop trying other endpoints
          break;
        }
      }
    }

    // If on intranet and failed with auth error, throw immediately
    if (authFailed) {
      throw lastError || new Error('Authentication failure on spd-apps.');
    }

    // In isolated test/cloud preview environments where intranet DNS 'spd-apps' cannot resolve over public internet,
    // Provide clean error details OR graceful algorithmic key generator if requested by technician.
    throw lastError || new Error('Network unavailable: Unable to reach https://spd-apps/FeaturePermissions/generate.');
  }
}
