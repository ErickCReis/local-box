import { queryOptions } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { setupStatus } from './-server'

export const queries = {
  key: ['host', 'setup-status'] as const,
  options() {
    return queryOptions({
      queryKey: this.key,
      queryFn: setupStatus,
    })
  },
  useOptions() {
    return queryOptions({
      queryKey: this.key,
      queryFn: useServerFn(setupStatus),
      refetchInterval: 5000,
    })
  },
}
