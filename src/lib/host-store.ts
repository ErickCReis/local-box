import { createServerOnlyFn } from '@tanstack/react-start'
import { Store } from '@tanstack/store'
import type { Tunnel } from 'cloudflared'

type HostStore = {
  tunnelApi: Tunnel | null
  tunnelUrlApi: string | null
  tunnelConvex: Tunnel | null
  tunnelUrlConvex: string | null
}

const hostStore = new Store<HostStore>({
  tunnelApi: null,
  tunnelUrlApi: null,
  tunnelConvex: null,
  tunnelUrlConvex: null,
})

export const getHostStore = createServerOnlyFn(() => hostStore.state)
export const setHostStore = createServerOnlyFn((state: HostStore) => {
  hostStore.setState(state)
})
