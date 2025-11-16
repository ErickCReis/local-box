import { queryOptions } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { getQuickTunnels } from './-server'
import type { QueryClient } from '@tanstack/react-query'

export const queries = {
  tunnelStatus: {
    key: ['tunnel', 'status'] as const,
    options() {
      return queryOptions({
        queryKey: this.key,
        queryFn: getQuickTunnels,
      })
    },
    useOptions() {
      return queryOptions({
        queryKey: this.key,
        queryFn: useServerFn(getQuickTunnels),
        refetchInterval: 5000,
      })
    },
    invalidate(queryClient: QueryClient) {
      queryClient.invalidateQueries({ queryKey: this.key })
    },
  },
}

