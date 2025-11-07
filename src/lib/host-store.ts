import { createServerOnlyFn } from '@tanstack/react-start'
import { Store } from '@tanstack/store'
import type { Tunnel } from 'cloudflared'

type HostStore = {
  tunnel: Tunnel | null
  tunnelUrl: string | null
}

const hostStore = new Store<HostStore>({
  tunnel: null,
  tunnelUrl: null,
})

export const getHostStore = createServerOnlyFn(() => hostStore.state)
export const setHostStore = createServerOnlyFn((state: HostStore) => {
  hostStore.setState(state)
})
