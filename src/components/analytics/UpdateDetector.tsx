import React, { useEffect, useRef } from 'react';
import { RealTimeStatus } from '../../hooks/useRealTimeUpdates';
import { UpdateEvent } from '../../services/realTimeUpdateService';

interface UpdateDetectorProps {
  realTimeStatus: RealTimeStatus;
  onDetectUpdates: () => Promise<UpdateEvent[]>;
  onTriggerRefresh: () => void;
  fallbackInterval?: number; // in milliseconds
  enabled?: boolean;
}

/**
 * UpdateDetector provides a fallback mechanism for detecting database updates
 * when real-time subscriptions are not working properly.
 */
const UpdateDetector: React.FC<UpdateDetectorProps> = ({
  realTimeStatus,
  onDetectUpdates,
  onTriggerRefresh,
  fallbackInterval = 30000, // 30 seconds default
  enabled = true
}) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<Date>(new Date());

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Only use fallback detection when real-time is not connected or has errors
    const shouldUseFallback = !realTimeStatus.isConnected || realTimeStatus.error;

    if (shouldUseFallback) {
      console.log('Real-time connection unavailable, starting fallback update detection');
      
      intervalRef.current = setInterval(async () => {
        try {
          console.log('Checking for manual updates (fallback)...');
          const updates = await onDetectUpdates();
          
          if (updates.length > 0) {
            console.log(`Fallback detected ${updates.length} updates, triggering refresh`);
            onTriggerRefresh();
          }
          
          lastCheckRef.current = new Date();
        } catch (error) {
          console.error('Error in fallback update detection:', error);
        }
      }, fallbackInterval);
    } else {
      // Real-time is working, clear fallback interval
      if (intervalRef.current) {
        console.log('Real-time connection restored, stopping fallback detection');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    realTimeStatus.isConnected, 
    realTimeStatus.error, 
    enabled, 
    fallbackInterval, 
    onDetectUpdates, 
    onTriggerRefresh
  ]);

  // This component doesn't render anything visible
  return null;
};

export default UpdateDetector;