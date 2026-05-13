import { vi } from 'vitest'

export function createSupabaseMock(tables = {}) {
  const calls = []

  function makeBuilder(table) {
    let op = 'select'
    const filters = []
    const builder = {}
    const chainMethods = [
      'select', 'eq', 'gte', 'lte', 'lt', 'gt', 'order',
      'limit', 'range', 'match', 'ilike', 'like', 'in', 'neq', 'is',
    ]
    for (const m of chainMethods) {
      builder[m] = (...args) => {
        filters.push([m, ...args])
        return builder
      }
    }
    builder.update = (vals) => { op = 'update'; filters.push(['update', vals]); return builder }
    builder.delete = () => { op = 'delete'; filters.push(['delete']); return builder }
    builder.insert = (vals) => { op = 'insert'; filters.push(['insert', vals]); return builder }
    builder.upsert = (vals) => { op = 'upsert'; filters.push(['upsert', vals]); return builder }

    function resolve(single = false) {
      const cfg = tables[table] || {}
      calls.push({ table, op, filters: [...filters], single })
      if (cfg.error) return { data: null, error: cfg.error, count: null }
      const raw = typeof cfg.data === 'function'
        ? cfg.data({ table, op, filters: [...filters] })
        : cfg.data
      if (single) {
        const single0 = Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null)
        return { data: single0, error: single0 ? null : { message: 'not found' } }
      }
      if (op === 'update' || op === 'delete' || op === 'insert' || op === 'upsert') {
        return { data: raw ?? null, error: null }
      }
      return { data: raw ?? [], error: null, count: cfg.count ?? (Array.isArray(raw) ? raw.length : 0) }
    }

    builder.single = () => Promise.resolve(resolve(true))
    builder.maybeSingle = () => Promise.resolve(resolve(true))
    builder.then = (onFulfilled, onRejected) =>
      Promise.resolve(resolve(false)).then(onFulfilled, onRejected)
    builder.catch = (onRejected) =>
      Promise.resolve(resolve(false)).catch(onRejected)
    return builder
  }

  const supabase = {
    from: vi.fn((table) => makeBuilder(table)),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'x' }, error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/img.jpg' } }),
      })),
    },
    _calls: calls,
  }
  return supabase
}
