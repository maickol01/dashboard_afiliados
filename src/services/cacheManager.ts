import { Person, Analytics, Period } from '../types'

// Cache entry interface with versioning and metadata
interface CacheEntry<T> {
  data: T
  timestamp: number
  version: string
  accessCount: number
  lastAccessed: number
  tags: string[]
  size: number
  ttl: number
}

// Cache configuration interface
interface CacheConfig {
  maxSize: number // Maximum cache size in MB
  defaultTtl: number // Default TTL in milliseconds
  maxEntries: number // Maximum number of cache entries
  enableMetrics: boolean
  enableWarming: boolean
  warmingInterval: number // Warming interval in milliseconds
}

// Cache metrics interface
interface CacheMetrics {
  hits: number
  misses: number
  evictions: number
  warmingEvents: number
  totalSize: number
  entryCount: number
  hitRate: number
  averageAccessTime: number
  lastCleanup: number
}

// Cache invalidation rules
interface InvalidationRule {
  pattern: string | RegExp
  tags: string[]
  condition?: (entry: CacheEntry<unknown>) => boolean
}

// Cache warming strategy
interface WarmingStrategy {
  key: string
  priority: number
  dataLoader: () => Promise<unknown>
  tags: string[]
  ttl?: number
}

export class IntelligentCacheManager {
  private cache = new Map<string, CacheEntry<unknown>>()
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    warmingEvents: 0,
    totalSize: 0,
    entryCount: 0,
    hitRate: 0,
    averageAccessTime: 0,
    lastCleanup: 0
  }
  
  private config: CacheConfig = {
    maxSize: 50, // 50MB
    defaultTtl: 5 * 60 * 1000, // 5 minutes
    maxEntries: 1000,
    enableMetrics: true,
    enableWarming: true,
    warmingInterval: 10 * 60 * 1000 // 10 minutes
  }
  
  private invalidationRules: InvalidationRule[] = []
  private warmingStrategies: WarmingStrategy[] = []
  private warmingTimer: NodeJS.Timeout | null = null
  private version = '1.0.0'
  
  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
    
    this.setupDefaultInvalidationRules()
    this.setupDefaultWarmingStrategies()
    
    if (this.config.enableWarming) {
      this.startCacheWarming()
    }
    
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  // Enhanced get method with metrics tracking
  async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now()
    
    try {
      const entry = this.cache.get(key) as CacheEntry<T> | undefined
      
      if (!entry) {
        this.recordMiss()
        return null
      }
      
      // Check if entry is expired
      if (this.isExpired(entry)) {
        this.cache.delete(key)
        this.updateSize(-entry.size)
        this.recordMiss()
        return null
      }
      
      // Update access metadata
      entry.accessCount++
      entry.lastAccessed = Date.now()
      
      this.recordHit()
      return entry.data
    } finally {
      const accessTime = performance.now() - startTime
      this.updateAverageAccessTime(accessTime)
    }
  }

  // Enhanced set method with versioning and size tracking
  async set<T>(
    key: string, 
    data: T, 
    options?: {
      ttl?: number
      tags?: string[]
      version?: string
    }
  ): Promise<void> {
    const ttl = options?.ttl || this.config.defaultTtl
    const tags = options?.tags || []
    const version = options?.version || this.version
    
    // Calculate approximate size
    const size = this.calculateSize(data)
    
    // Check if we need to evict entries
    await this.ensureCapacity(size)
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version,
      accessCount: 0,
      lastAccessed: Date.now(),
      tags,
      size,
      ttl
    }
    
    // Remove old entry if exists
    const oldEntry = this.cache.get(key)
    if (oldEntry) {
      this.updateSize(-oldEntry.size)
    }
    
    this.cache.set(key, entry as CacheEntry<unknown>)
    this.updateSize(size)
    this.metrics.entryCount = this.cache.size
  }

  // Smart invalidation with pattern matching and tags
  async invalidate(pattern: string | string[] | InvalidationRule): Promise<number> {
    let invalidatedCount = 0
    
    if (typeof pattern === 'string') {
      // Simple key invalidation
      if (this.cache.has(pattern)) {
        const entry = this.cache.get(pattern)!
        this.cache.delete(pattern)
        this.updateSize(-entry.size)
        invalidatedCount = 1
      }
    } else if (Array.isArray(pattern)) {
      // Multiple key invalidation
      for (const key of pattern) {
        if (this.cache.has(key)) {
          const entry = this.cache.get(key)!
          this.cache.delete(key)
          this.updateSize(-entry.size)
          invalidatedCount++
        }
      }
    } else {
      // Rule-based invalidation
      const rule = pattern as InvalidationRule
      const keysToDelete: string[] = []
      
      for (const [key, entry] of this.cache.entries()) {
        let shouldInvalidate = false
        
        // Check pattern match
        if (typeof rule.pattern === 'string') {
          shouldInvalidate = key.includes(rule.pattern)
        } else {
          shouldInvalidate = rule.pattern.test(key)
        }
        
        // Check tag match
        if (!shouldInvalidate && rule.tags.length > 0) {
          shouldInvalidate = rule.tags.some(tag => entry.tags.includes(tag))
        }
        
        // Check custom condition
        if (!shouldInvalidate && rule.condition) {
          shouldInvalidate = rule.condition(entry)
        }
        
        if (shouldInvalidate) {
          keysToDelete.push(key)
        }
      }
      
      // Delete matched entries
      for (const key of keysToDelete) {
        const entry = this.cache.get(key)!
        this.cache.delete(key)
        this.updateSize(-entry.size)
        invalidatedCount++
      }
    }
    
    this.metrics.entryCount = this.cache.size
    return invalidatedCount
  }

  // Cache warming implementation
  async warmCache(): Promise<void> {
    if (!this.config.enableWarming) return
    
    console.log('Starting cache warming...')
    
    // Sort strategies by priority
    const sortedStrategies = [...this.warmingStrategies].sort((a, b) => b.priority - a.priority)
    
    for (const strategy of sortedStrategies) {
      try {
        // Check if entry already exists and is fresh
        const existing = await this.get(strategy.key)
        if (existing) continue
        
        console.log(`Warming cache for key: ${strategy.key}`)
        const data = await strategy.dataLoader()
        
        await this.set(strategy.key, data, {
          tags: strategy.tags,
          ttl: strategy.ttl
        })
        
        this.metrics.warmingEvents++
      } catch (error) {
        console.error(`Failed to warm cache for key ${strategy.key}:`, error)
      }
    }
    
    console.log('Cache warming completed')
  }

  // Version-aware cache operations
  async getWithVersion<T>(key: string, expectedVersion?: string): Promise<{ data: T; version: string } | null> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    
    if (!entry || this.isExpired(entry)) {
      return null
    }
    
    if (expectedVersion && entry.version !== expectedVersion) {
      // Version mismatch, invalidate entry
      this.cache.delete(key)
      this.updateSize(-entry.size)
      return null
    }
    
    entry.accessCount++
    entry.lastAccessed = Date.now()
    this.recordHit()
    
    return {
      data: entry.data,
      version: entry.version
    }
  }

  // Batch operations for better performance
  async getBatch<T>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>()
    
    for (const key of keys) {
      const data = await this.get<T>(key)
      if (data !== null) {
        results.set(key, data)
      }
    }
    
    return results
  }

  async setBatch<T>(entries: Array<{ key: string; data: T; options?: { ttl?: number; tags?: string[] } }>): Promise<void> {
    for (const entry of entries) {
      await this.set(entry.key, entry.data, entry.options)
    }
  }

  // Performance monitoring and metrics
  getMetrics(): CacheMetrics {
    return {
      ...this.metrics,
      hitRate: this.metrics.hits + this.metrics.misses > 0 
        ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100 
        : 0
    }
  }

  getDetailedMetrics(): {
    metrics: CacheMetrics
    topKeys: Array<{ key: string; accessCount: number; size: number }>
    memoryUsage: { used: number; max: number; percentage: number }
    entryDistribution: { byTag: Record<string, number>; byAge: Record<string, number> }
  } {
    const topKeys = Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        size: entry.size
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10)
    
    const memoryUsage = {
      used: this.metrics.totalSize,
      max: this.config.maxSize * 1024 * 1024, // Convert MB to bytes
      percentage: (this.metrics.totalSize / (this.config.maxSize * 1024 * 1024)) * 100
    }
    
    const byTag: Record<string, number> = {}
    const byAge: Record<string, number> = {}
    const now = Date.now()
    
    for (const entry of this.cache.values()) {
      // Count by tags
      for (const tag of entry.tags) {
        byTag[tag] = (byTag[tag] || 0) + 1
      }
      
      // Count by age
      const ageMinutes = Math.floor((now - entry.timestamp) / (60 * 1000))
      const ageGroup = ageMinutes < 5 ? '0-5min' : 
                      ageMinutes < 15 ? '5-15min' : 
                      ageMinutes < 60 ? '15-60min' : '60min+'
      byAge[ageGroup] = (byAge[ageGroup] || 0) + 1
    }
    
    return {
      metrics: this.getMetrics(),
      topKeys,
      memoryUsage,
      entryDistribution: { byTag, byAge }
    }
  }

  // Cache health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical'
    issues: string[]
    recommendations: string[]
  }> {
    const issues: string[] = []
    const recommendations: string[] = []
    const metrics = this.getMetrics()
    
    // Check hit rate
    if (metrics.hitRate < 50) {
      issues.push(`Low hit rate: ${metrics.hitRate.toFixed(1)}%`)
      recommendations.push('Consider adjusting TTL values or warming strategies')
    }
    
    // Check memory usage
    const memoryUsage = (metrics.totalSize / (this.config.maxSize * 1024 * 1024)) * 100
    if (memoryUsage > 80) {
      issues.push(`High memory usage: ${memoryUsage.toFixed(1)}%`)
      recommendations.push('Consider increasing max size or reducing TTL')
    }
    
    // Check eviction rate
    const totalOperations = metrics.hits + metrics.misses
    const evictionRate = totalOperations > 0 ? (metrics.evictions / totalOperations) * 100 : 0
    if (evictionRate > 10) {
      issues.push(`High eviction rate: ${evictionRate.toFixed(1)}%`)
      recommendations.push('Consider increasing cache size or optimizing data size')
    }
    
    const status = issues.length === 0 ? 'healthy' : 
                   issues.length <= 2 ? 'warning' : 'critical'
    
    return { status, issues, recommendations }
  }

  // Clear cache with optional pattern
  async clear(pattern?: string | RegExp): Promise<number> {
    let clearedCount = 0
    
    if (!pattern) {
      clearedCount = this.cache.size
      this.cache.clear()
      this.metrics.totalSize = 0
      this.metrics.entryCount = 0
    } else {
      const keysToDelete: string[] = []
      
      for (const key of this.cache.keys()) {
        const shouldDelete = typeof pattern === 'string' 
          ? key.includes(pattern)
          : pattern.test(key)
        
        if (shouldDelete) {
          keysToDelete.push(key)
        }
      }
      
      for (const key of keysToDelete) {
        const entry = this.cache.get(key)!
        this.cache.delete(key)
        this.updateSize(-entry.size)
        clearedCount++
      }
      
      this.metrics.entryCount = this.cache.size
    }
    
    return clearedCount
  }

  // Private helper methods
  private setupDefaultInvalidationRules(): void {
    this.invalidationRules = [
      {
        pattern: /^hierarchical-data/,
        tags: ['data', 'hierarchy'],
        condition: (entry) => Date.now() - entry.timestamp > 10 * 60 * 1000 // 10 minutes
      },
      {
        pattern: /^analytics/,
        tags: ['analytics', 'computed'],
        condition: (entry) => Date.now() - entry.timestamp > 5 * 60 * 1000 // 5 minutes
      },
      {
        pattern: /^leader-performance/,
        tags: ['performance', 'leaders'],
        condition: (entry) => Date.now() - entry.timestamp > 3 * 60 * 1000 // 3 minutes
      }
    ]
  }

  private setupDefaultWarmingStrategies(): void {
    // These will be populated by the DataService
    this.warmingStrategies = []
  }

  private startCacheWarming(): void {
    if (this.warmingTimer) {
      clearInterval(this.warmingTimer)
    }
    
    this.warmingTimer = setInterval(() => {
      this.warmCache().catch(error => {
        console.error('Cache warming failed:', error)
      })
    }, this.config.warmingInterval)
  }

  private async ensureCapacity(newEntrySize: number): Promise<void> {
    const maxSizeBytes = this.config.maxSize * 1024 * 1024
    
    // Check size limit
    while (this.metrics.totalSize + newEntrySize > maxSizeBytes || 
           this.cache.size >= this.config.maxEntries) {
      await this.evictLeastUsed()
    }
  }

  private async evictLeastUsed(): Promise<void> {
    if (this.cache.size === 0) return
    
    // Find least recently used entry
    let lruKey = ''
    let lruTime = Date.now()
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed
        lruKey = key
      }
    }
    
    if (lruKey) {
      const entry = this.cache.get(lruKey)!
      this.cache.delete(lruKey)
      this.updateSize(-entry.size)
      this.metrics.evictions++
    }
  }

  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key)
      }
    }
    
    for (const key of keysToDelete) {
      const entry = this.cache.get(key)!
      this.cache.delete(key)
      this.updateSize(-entry.size)
    }
    
    this.metrics.entryCount = this.cache.size
    this.metrics.lastCleanup = now
    
    if (keysToDelete.length > 0) {
      console.log(`Cleaned up ${keysToDelete.length} expired cache entries`)
    }
  }

  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  private calculateSize(data: unknown): number {
    // Rough estimation of object size in bytes
    const jsonString = JSON.stringify(data)
    return new Blob([jsonString]).size
  }

  private updateSize(delta: number): void {
    this.metrics.totalSize += delta
    if (this.metrics.totalSize < 0) {
      this.metrics.totalSize = 0
    }
  }

  private recordHit(): void {
    this.metrics.hits++
  }

  private recordMiss(): void {
    this.metrics.misses++
  }

  private updateAverageAccessTime(accessTime: number): void {
    const totalOperations = this.metrics.hits + this.metrics.misses
    if (totalOperations === 1) {
      this.metrics.averageAccessTime = accessTime
    } else {
      this.metrics.averageAccessTime = 
        (this.metrics.averageAccessTime * (totalOperations - 1) + accessTime) / totalOperations
    }
  }

  // Public methods for external configuration
  addInvalidationRule(rule: InvalidationRule): void {
    this.invalidationRules.push(rule)
  }

  addWarmingStrategy(strategy: WarmingStrategy): void {
    this.warmingStrategies.push(strategy)
  }

  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config }
    
    if (config.enableWarming !== undefined) {
      if (config.enableWarming && !this.warmingTimer) {
        this.startCacheWarming()
      } else if (!config.enableWarming && this.warmingTimer) {
        clearInterval(this.warmingTimer)
        this.warmingTimer = null
      }
    }
  }

  // Cleanup resources
  destroy(): void {
    if (this.warmingTimer) {
      clearInterval(this.warmingTimer)
      this.warmingTimer = null
    }
    this.cache.clear()
    this.metrics.totalSize = 0
    this.metrics.entryCount = 0
  }
}

// Singleton instance
export const cacheManager = new IntelligentCacheManager()