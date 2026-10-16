import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchIoTLatest, fetchIoTDevices, fetchIoTAlerts } from '../services/api';

/**
 * Custom hook to manage IoT telemetry streaming and polling
 * Polling interval: 3500ms (stops on unmount)
 */
export function useIoTData(pollIntervalMs = 3500) {
  const [devices, setDevices] = useState([]);
  const [latestMap, setLatestMap] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const isMountedRef = useRef(true);

  const loadData = useCallback(async () => {
    try {
      const [devData, latestData, alertsData] = await Promise.all([
        fetchIoTDevices().catch(() => []),
        fetchIoTLatest().catch(() => ({ latest: {} })),
        fetchIoTAlerts(20).catch(() => [])
      ]);

      if (!isMountedRef.current) return;

      setDevices(Array.isArray(devData) ? devData : []);
      setLatestMap(latestData?.latest || {});
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
      setLastUpdated(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message || 'Error fetching telemetry');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();

    // Periodic polling every 3.5 seconds
    const interval = setInterval(() => {
      loadData();
    }, pollIntervalMs);

    // Stop polling automatically when user unmounts/leaves
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [loadData, pollIntervalMs]);

  return {
    devices,
    latestMap,
    alerts,
    loading,
    error,
    lastUpdated,
    refresh: loadData
  };
}
