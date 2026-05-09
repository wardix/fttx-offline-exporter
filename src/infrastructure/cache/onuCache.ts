import { OnuCacheEntry } from '../../domain/models'

class OnuCache {
  private cache = new Map<string, OnuCacheEntry>()

  get(circuitId: string): OnuCacheEntry | undefined {
    return this.cache.get(circuitId)
  }

  set(circuitId: string, entry: OnuCacheEntry): void {
    this.cache.set(circuitId, entry)
  }

  delete(circuitId: string): void {
    this.cache.delete(circuitId)
  }

  entries(): IterableIterator<[string, OnuCacheEntry]> {
    return this.cache.entries()
  }

  cleanupExpired(): void {
    const now = Date.now()
    let deletedCount = 0
    for (const [circuitId, entry] of this.entries()) {
      if (now > entry.expireAt) {
        this.delete(circuitId)
        deletedCount++
      }
    }
    if (deletedCount > 0) {
      console.log(
        `[Cache Cleanup] Removed ${deletedCount} expired entries from memory.`,
      )
    }
  }
}

export const onuCache = new OnuCache()
