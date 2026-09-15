import React, { useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { onDataChanged } from '../api/client';

// Usage: useAutoRefresh(load) inside a screen that already calls load() in
// its own useFocusEffect. While the screen is focused, any write from any
// device (this one or another) re-triggers load() so lists stay live.
//
// Implementation note: loadFn is stored in a ref and always called via
// loadRef.current(), so passing a fresh inline arrow function on every
// render (e.g. useAutoRefresh(() => load(search))) does NOT cause the
// underlying subscription to tear down and resubscribe on every render —
// only actually focusing/unfocusing the screen does that.
export function useAutoRefresh(loadFn) {
  const loadRef = useRef(loadFn);
  useEffect(() => { loadRef.current = loadFn; }, [loadFn]);

  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = onDataChanged(() => loadRef.current());
      return unsubscribe;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );
}

export default useAutoRefresh;
