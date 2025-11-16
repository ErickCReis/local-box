import { queryOptions } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { checkDockerDaemon, checkDockerImages } from './-server'
import type { QueryClient } from '@tanstack/react-query'

export const queries = {
  dockerDaemon: {
    key: ['docker', 'daemon'] as const,
    options() {
      return queryOptions({
        queryKey: this.key,
        queryFn: checkDockerDaemon,
      })
    },
    useOptions() {
      return queryOptions({
        queryKey: this.key,
        queryFn: useServerFn(checkDockerDaemon),
        refetchInterval: 5000,
      })
    },
    invalidate(queryClient: QueryClient) {
      queryClient.invalidateQueries({ queryKey: this.key })
    },
  },
  dockerImages: {
    key: ['docker', 'images'] as const,
    options() {
      return queryOptions({
        queryKey: this.key,
        queryFn: checkDockerImages,
      })
    },
    useOptions(enabled = true) {
      return queryOptions({
        queryKey: this.key,
        queryFn: useServerFn(checkDockerImages),
        refetchInterval: 5000,
        enabled,
      })
    },
    invalidate(queryClient: QueryClient) {
      queryClient.invalidateQueries({ queryKey: this.key })
    },
  },
}
