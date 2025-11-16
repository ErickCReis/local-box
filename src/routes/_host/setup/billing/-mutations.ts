import { mutationOptions, useMutationState } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { updateBillingConfig } from './-server'

export const mutations = {
  billingUpdateConfig: {
    key: ['billing', 'update-config'] as const,
    useOptions() {
      return mutationOptions({
        mutationKey: this.key,
        mutationFn: useServerFn(updateBillingConfig),
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
