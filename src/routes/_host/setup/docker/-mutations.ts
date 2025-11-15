import { mutationOptions, useMutationState } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { dockerDown, dockerUp } from './-server'

export const mutations = {
  dockerUp: {
    key: ['docker', 'up'] as const,
    options() {
      return mutationOptions({
        mutationKey: this.key,
        mutationFn: useServerFn(dockerUp),
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
  dockerDown: {
    key: ['docker', 'down'] as const,
    options() {
      return mutationOptions({
        mutationKey: this.key,
        mutationFn: useServerFn(dockerDown),
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
