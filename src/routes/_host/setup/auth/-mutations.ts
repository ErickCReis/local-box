import { mutationOptions, useMutationState } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { createOwnerUser } from './-server'

export const mutations = {
  authCreateOwner: {
    key: ['auth', 'create-owner'] as const,
    useOptions() {
      return mutationOptions({
        mutationKey: this.key,
        mutationFn: useServerFn(createOwnerUser),
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
