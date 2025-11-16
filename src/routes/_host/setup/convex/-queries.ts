import { queryOptions } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { checkConvexAdminKey, checkConvexHealth } from './-server'
import type { QueryClient } from '@tanstack/react-query'

export const queries = {
  convexHealth: {
    key: ['convex', 'health'] as const,
    options() {
      return queryOptions({
        queryKey: this.key,
        queryFn: checkConvexHealth,
      })
    },
    useOptions() {
      return queryOptions({
        queryKey: this.key,
        queryFn: useServerFn(checkConvexHealth),
        refetchInterval: 5000,
      })
    },
    invalidate(queryClient: QueryClient) {
      queryClient.invalidateQueries({ queryKey: this.key })
    },
  },
  convexAdminKey: {
    key: ['convex', 'admin-key'] as const,
    options() {
      return queryOptions({
        queryKey: this.key,
        queryFn: checkConvexAdminKey,
      })
    },
    useOptions() {
      return queryOptions({
        queryKey: this.key,
        queryFn: useServerFn(checkConvexAdminKey),
        refetchInterval: 5000,
      })
    },
    invalidate(queryClient: QueryClient) {
      queryClient.invalidateQueries({ queryKey: this.key })
    },
  },
}
