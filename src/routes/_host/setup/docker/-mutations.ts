import { mutationOptions, useMutationState } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { dockerDown, dockerUp } from './-server'

export const mutations = {
  dockerUp: {
    key: ['docker', 'up'] as const,
    useOptions() {
      const mutationFn = useServerFn(dockerUp)
      return mutationOptions({
        mutationKey: this.key,
        mutationFn,
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
    useOptions() {
      const mutationFn = useServerFn(dockerDown)
      return mutationOptions({
        mutationKey: this.key,
        mutationFn,
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
