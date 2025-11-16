import { queryOptions } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { getBillingConfig } from './-server'
import type { QueryClient } from '@tanstack/react-query'

export const queries = {
  billingConfig: {
    key: ['billing', 'config'] as const,
    options() {
      return queryOptions({
        queryKey: this.key,
        queryFn: useServerFn(getBillingConfig),
        refetchInterval: 5000,
      })
    },
    invalidate(queryClient: QueryClient) {
      queryClient.invalidateQueries({ queryKey: this.key })
    },
  },
}

