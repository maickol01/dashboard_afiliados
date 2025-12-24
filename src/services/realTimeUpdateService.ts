import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface UpdateEvent {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
  timestamp: Date;
}

export interface UpdateListener {
  onUpdate: (event: UpdateEvent) => void;
  onError?: (error: Error) => void;
}

export class RealTimeUpdateService {
  private static instance: RealTimeUpdateService;
  private channels: Map<string, RealtimeChannel> = new Map();
  private listeners: Set<UpdateListener> = new Set();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Start with 1 second
  private lastUpdateTime: Date = new Date();
  private updateQueue: UpdateEvent[] = [];
  private processingQueue: boolean = false;

  private constructor() {
    this.setupRealtimeSubscriptions();
  }

  static getInstance(): RealTimeUpdateService {
    if (!RealTimeUpdateService.instance) {
      RealTimeUpdateService.instance = new RealTimeUpdateService();
    }
    return RealTimeUpdateService.instance;
  }

  /**
   * Subscribe to real-time updates for all relevant tables
   */
  private setupRealtimeSubscriptions(): void {
    const tables = ['lideres', 'brigadistas', 'movilizadores', 'ciudadanos'];
    
    tables.forEach(table => {
      this.subscribeToTable(table);
    });

    // Monitor connection status
    this.monitorConnectionStatus();
  }

  /**
   * Subscribe to real-time updates for a specific table
   */
  private subscribeToTable(tableName: string): void {
    try {
      const channel = supabase
        .channel(`${tableName}_changes`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: tableName,
          },
          (payload) => {
            this.handleDatabaseChange(tableName, payload);
          }
        )
        .subscribe((status) => {
          console.log(`Realtime subscription status for ${tableName}:`, status);
          
          if (status === 'SUBSCRIBED') {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            console.log(`Successfully subscribed to ${tableName} changes`);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            this.isConnected = false;
            this.handleConnectionError(tableName);
          }
        });

      this.channels.set(tableName, channel);
    } catch (error) {
      console.error(`Error subscribing to ${tableName}:`, error);
      this.handleConnectionError(tableName);
    }
  }

  /**
   * Handle database changes from Supabase realtime
   */
  private handleDatabaseChange(tableName: string, payload: unknown): void {
    try {
      const payloadData = payload as {
        eventType: 'INSERT' | 'UPDATE' | 'DELETE';
        new?: Record<string, unknown>;
        old?: Record<string, unknown>;
      };

      const updateEvent: UpdateEvent = {
        table: tableName,
        eventType: payloadData.eventType,
        new: payloadData.new,
        old: payloadData.old,
        timestamp: new Date()
      };

      console.log(`Database change detected in ${tableName}:`, updateEvent);

      // Add to queue for processing
      this.updateQueue.push(updateEvent);
      this.lastUpdateTime = new Date();

      // Process queue if not already processing
      if (!this.processingQueue) {
        this.processUpdateQueue();
      }

    } catch (error) {
      console.error('Error handling database change:', error);
      this.notifyListenersError(new Error(`Failed to process database change: ${error}`));
    }
  }

  /**
   * Process queued updates with debouncing to avoid excessive notifications
   */
  private async processUpdateQueue(): Promise<void> {
    if (this.processingQueue || this.updateQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    try {
      // Wait a short time to collect multiple updates
      await new Promise(resolve => setTimeout(resolve, 500));

      // Process all queued updates
      const eventsToProcess = [...this.updateQueue];
      this.updateQueue = [];

      // Group events by table for efficient processing (for future use)
      // const eventsByTable = eventsToProcess.reduce((acc, event) => {
      //   if (!acc[event.table]) {
      //     acc[event.table] = [];
      //   }
      //   acc[event.table].push(event);
      //   return acc;
      // }, {} as Record<string, UpdateEvent[]>);

      // Notify listeners about the updates
      for (const event of eventsToProcess) {
        this.notifyListeners(event);
      }

      console.log(`Processed ${eventsToProcess.length} database updates`);

    } catch (error) {
      console.error('Error processing update queue:', error);
      this.notifyListenersError(new Error(`Failed to process updates: ${error}`));
    } finally {
      this.processingQueue = false;

      // Process any new updates that arrived while processing
      if (this.updateQueue.length > 0) {
        setTimeout(() => this.processUpdateQueue(), 100);
      }
    }
  }

  /**
   * Monitor connection status and handle reconnections
   */
  private monitorConnectionStatus(): void {
    // Check connection status every 30 seconds
    setInterval(() => {
      if (!this.isConnected && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnection();
      }
    }, 30000);
  }

  /**
   * Handle connection errors and attempt reconnection
   */
  private handleConnectionError(tableName: string): void {
    console.warn(`Connection error for ${tableName}, attempting reconnection...`);
    this.isConnected = false;
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.attemptReconnection();
      }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts)); // Exponential backoff
    } else {
      console.error('Max reconnection attempts reached. Real-time updates disabled.');
      this.notifyListenersError(new Error('Real-time connection failed after multiple attempts'));
    }
  }

  /**
   * Attempt to reconnect to Supabase realtime
   */
  private attemptReconnection(): void {
    this.reconnectAttempts++;
    console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    // Unsubscribe from existing channels
    this.channels.forEach((channel, tableName) => {
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.warn(`Error removing channel for ${tableName}:`, error);
      }
    });
    this.channels.clear();

    // Re-establish subscriptions
    this.setupRealtimeSubscriptions();
  }

  /**
   * Add a listener for real-time updates
   */
  addListener(listener: UpdateListener): void {
    this.listeners.add(listener);
  }

  /**
   * Remove a listener
   */
  removeListener(listener: UpdateListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of an update
   */
  private notifyListeners(event: UpdateEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener.onUpdate(event);
      } catch (error) {
        console.error('Error in update listener:', error);
      }
    });
  }

  /**
   * Notify all listeners of an error
   */
  private notifyListenersError(error: Error): void {
    this.listeners.forEach(listener => {
      try {
        if (listener.onError) {
          listener.onError(error);
        }
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    isConnected: boolean;
    lastUpdateTime: Date;
    reconnectAttempts: number;
    queuedUpdates: number;
  } {
    return {
      isConnected: this.isConnected,
      lastUpdateTime: this.lastUpdateTime,
      reconnectAttempts: this.reconnectAttempts,
      queuedUpdates: this.updateQueue.length
    };
  }

  /**
   * Force a connection check
   */
  async checkConnection(): Promise<boolean> {
    try {
      // Test connection by making a simple query
      const { error } = await supabase.from('lideres').select('id').limit(1);
      
      if (error) {
        this.isConnected = false;
        return false;
      }
      
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Connection check failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Manually trigger update detection (fallback mechanism)
   */
  async detectUpdates(): Promise<UpdateEvent[]> {
    try {
      const tables = ['lideres', 'brigadistas', 'movilizadores', 'ciudadanos'];
      const updates: UpdateEvent[] = [];
      
      // Check for recent updates in each table
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('id, created_at')
          .gte('created_at', fiveMinutesAgo.toISOString())
          .order('created_at', { ascending: false });
        
        if (error) {
          console.warn(`Error checking updates for ${table}:`, error);
          continue;
        }
        
        if (data && data.length > 0) {
          data.forEach(record => {
            updates.push({
              table,
              eventType: 'INSERT',
              new: record,
              timestamp: new Date(record.created_at)
            });
          });
        }
      }
      
      return updates;
    } catch (error) {
      console.error('Error detecting manual updates:', error);
      return [];
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Unsubscribe from all channels
    this.channels.forEach((channel, tableName) => {
      try {
        supabase.removeChannel(channel);
        console.log(`Unsubscribed from ${tableName} changes`);
      } catch (error) {
        console.warn(`Error unsubscribing from ${tableName}:`, error);
      }
    });
    
    this.channels.clear();
    this.listeners.clear();
    this.updateQueue = [];
    this.isConnected = false;
  }
}

// Export singleton instance
export const realTimeUpdateService = RealTimeUpdateService.getInstance();