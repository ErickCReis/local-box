import { mutationOptions, useMutationState } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { startQuickTunnels, stopQuickTunnels } from './-server'

export const mutations = {
  tunnelStart: {
    key: ['tunnel', 'start'] as const,
    options() {
      return mutationOptions({
        mutationKey: this.key,
        mutationFn: useServerFn(startQuickTunnels),
      })
    },
    useIsPending() {
      return (
        useMutationState({
          filters: { mutationKey: this.key, status: 'pending' },
        }).length > 0
      )
    },
  },
  tunnelStop: {
    key: ['tunnel', 'stop'] as const,
    options() {
      return mutationOptions({
        mutationKey: this.key,
        mutationFn: useServerFn(stopQuickTunnels),
      })
    },
    useIsPending() {
      return (
        useMutationState({
          filters: { mutationKey: this.key, status: 'pending' },
        }).length > 0
      )
    },
  },
}
