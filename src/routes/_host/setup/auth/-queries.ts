import { queryOptions } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { checkAuthHealth } from './-server'
import type { QueryClient } from '@tanstack/react-query'

export const queries = {
  authHealth: {
    key: ['auth', 'health'] as const,
    options() {
      return queryOptions({
        queryKey: this.key,
        queryFn: useServerFn(checkAuthHealth),
        refetchInterval: 5000,
      })
    },
    invalidate(queryClient: QueryClient) {
      queryClient.invalidateQueries({ queryKey: this.key })
    },
  },
}
