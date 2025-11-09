import { QueryClient } from '@tanstack/react-query'
import { Store, useStore } from '@tanstack/react-store'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { convexClient } from '@convex-dev/better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import type { AuthClient } from '@convex-dev/better-auth/react'

export const clientStore = new Store({
  hostUrl: null,
  queryClient: new QueryClient(),
  convexQueryClient: null,
  authClient: null,
} as
  | {
      hostUrl: null
      queryClient: QueryClient
      convexQueryClient: null
      authClient: null
    }
  | {
      hostUrl: string
      queryClient: QueryClient
      convexQueryClient: ConvexQueryClient
      authClient: AuthClient
    })

export function useClientStore() {
  const state = useStore(clientStore)
  return {
    ...state,
    setHostUrl: updateClientStore,
  }
}

function createClientStore(convexUrl: string) {
  const { queryClient } = clientStore.state

  const convexQueryClient = new ConvexQueryClient(convexUrl, {
    verbose: true,
    expectAuth: true,
  })

  queryClient.defaultQueryOptions({
    queryKey: [],
    queryKeyHashFn: convexQueryClient.hashFn(),
    queryFn: convexQueryClient.queryFn(),
    gcTime: 5000,
  })

  convexQueryClient.connect(queryClient)

  return convexQueryClient
}

function updateClientStore(hostUrl: string | null) {
  const { hostUrl: currentHostUrl, queryClient } = clientStore.state
  if (currentHostUrl === hostUrl) return

  clearClientStore()
  if (!hostUrl) {
    window.localStorage.removeItem('hostUrl')
    return
  }

  window.localStorage.setItem('hostUrl', hostUrl)

  const convexQueryClient = createClientStore(`${hostUrl}/convex-host`)

  const authClient = createAuthClient({
    baseURL: hostUrl,
    fetchOptions: {
      credentials: 'include',
    },
    plugins: [convexClient()],
  })

  clientStore.setState({
    hostUrl,
    queryClient,
    convexQueryClient,
    authClient,
  })
}

function clearClientStore() {
  const { convexQueryClient, queryClient } = clientStore.state
  if (convexQueryClient) {
    convexQueryClient.convexClient.close()
    queryClient.clear()
  }

  clientStore.setState({
    hostUrl: null,
    convexQueryClient: null,
    authClient: null,
    queryClient,
  })
}

if (typeof window !== 'undefined') {
  const storedHostUrl = window.localStorage.getItem('hostUrl')
  updateClientStore(storedHostUrl)
}
