import { useState, useEffect, useCallback } from 'react';

// status: 'checking' | 'licensed' | 'locked'
// Same logic as the mobile app's hook, routed through window.desktopAPI.
export function useLicenseGate() {
  const [status, setStatus] = useState('checking');
  const [licenseState, setLicenseState] = useState(null);
  const [error, setError] = useState('');

  const runStartupCheck = useCallback(async () => {
    setStatus('checking');
    setError('');
    const cached = await window.desktopAPI.licenseGetCached();

    if (cached && cached.isBypass) {
      setLicenseState(cached);
      setStatus('licensed');
      return;
    }

    if (cached && cached.valid && (await window.desktopAPI.licenseIsWithinGrace(cached))) {
      setLicenseState(cached);
      setStatus('licensed');
      window.desktopAPI.licenseVerify(cached.licenseKey).then((fresh) => {
        setLicenseState(fresh);
        if (!fresh.valid) setStatus('locked');
      }).catch(() => { /* offline — the cached grace period already covers this */ });
      return;
    }

    if (cached && cached.licenseKey) {
      try {
        const fresh = await window.desktopAPI.licenseVerify(cached.licenseKey);
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

    setStatus('locked');
  }, []);

  useEffect(() => { runStartupCheck(); }, [runStartupCheck]);

  async function submitKey(key) {
    setStatus('checking');
    setError('');
    try {
      const fresh = await window.desktopAPI.licenseVerify(key.trim());
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
    const state = await window.desktopAPI.licenseBypass();
    setLicenseState(state);
    setStatus('licensed');
  }

  return { status, licenseState, error, submitKey, bypass, retry: runStartupCheck };
}
