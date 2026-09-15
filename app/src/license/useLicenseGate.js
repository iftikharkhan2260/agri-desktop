import { useState, useEffect, useCallback } from 'react';
import licenseService from './licenseService';

// status: 'checking' | 'licensed' | 'locked'
export function useLicenseGate() {
  const [status, setStatus] = useState('checking');
  const [licenseState, setLicenseState] = useState(null);
  const [error, setError] = useState('');

  const runStartupCheck = useCallback(async () => {
    setStatus('checking');
    setError('');
    const cached = await licenseService.getCachedLicense();

    // Dev/support bypass never expires and never re-checks online — it's a
    // deliberate manual override, not a real license.
    if (cached && cached.isBypass) {
      setLicenseState(cached);
      setStatus('licensed');
      return;
    }

    if (cached && cached.valid && licenseService.isWithinGracePeriod(cached)) {
      // Good to go immediately; quietly refresh in the background so a
      // revoked/expired license is caught before the grace period runs out.
      setLicenseState(cached);
      setStatus('licensed');
      licenseService.verifyLicenseOnline(cached.licenseKey).then((fresh) => {
        setLicenseState(fresh);
        if (!fresh.valid) setStatus('locked');
      }).catch(() => { /* offline — the cached grace period already covers this */ });
      return;
    }

    if (cached && cached.licenseKey) {
      // No valid grace period left — must reach the server now.
      try {
        const fresh = await licenseService.verifyLicenseOnline(cached.licenseKey);
        setLicenseState(fresh);
        setStatus(fresh.valid ? 'licensed' : 'locked');
        if (!fresh.valid) setError(fresh.message || 'License is no longer valid.');
      } catch (err) {
        setLicenseState(cached);
        setStatus('locked');
        setError('Could not reach the license server and the offline grace period has ended. Connect to the internet and try again.');
      }
      return;
    }

    // Never licensed on this device before.
    setStatus('locked');
  }, []);

  useEffect(() => { runStartupCheck(); }, [runStartupCheck]);

  async function submitKey(key) {
    setStatus('checking');
    setError('');
    try {
      const fresh = await licenseService.verifyLicenseOnline(key.trim());
      setLicenseState(fresh);
      if (fresh.valid) {
        setStatus('licensed');
      } else {
        setStatus('locked');
        setError(fresh.message || 'This license key is not valid.');
      }
    } catch (err) {
      setStatus('locked');
      setError(err.message);
    }
  }

  async function bypass() {
    const state = await licenseService.activateBypass();
    setLicenseState(state);
    setStatus('licensed');
  }

  return { status, licenseState, error, submitKey, bypass, retry: runStartupCheck };
}
