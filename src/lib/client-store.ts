import { QueryClient } from '@tanstack/react-query'
import { Store, useStore } from '@tanstack/react-store'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { convexClient } from '@convex-dev/better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import type { AuthClient } from '@convex-dev/better-auth/react'

export const clientStore = new Store({
  hostUrl: null,
  convexUrl: null,
  queryClient: new QueryClient(),
  convexQueryClient: null,
  authClient: null,
} as
  | {
      hostUrl: null
      convexUrl: null
      queryClient: QueryClient
      convexQueryClient: null
      authClient: null
    }
  | {
      hostUrl: string
      convexUrl: string
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

function updateClientStore(hostUrl: string | null, convexUrl?: string | null) {
  const {
    hostUrl: currentHostUrl,
    convexUrl: currentConvexUrl,
    queryClient,
  } = clientStore.state
  if (currentHostUrl === hostUrl && currentConvexUrl === convexUrl) return

  clearClientStore()
  if (!hostUrl) {
    window.localStorage.removeItem('hostUrl')
    window.localStorage.removeItem('convexUrl')
    return
  }

  if (!convexUrl) {
    throw new Error('Convex URL is required when setting host URL')
  }

  window.localStorage.setItem('hostUrl', hostUrl)
  window.localStorage.setItem('convexUrl', convexUrl)

  const convexQueryClient = createClientStore(`${hostUrl}/convex-host`)
  // const convexQueryClient = createClientStore(convexUrl)

  const authClient = createAuthClient({
    baseURL: hostUrl,
    fetchOptions: {
      credentials: 'include',
    },
    plugins: [convexClient()],
  })

  clientStore.setState({
    hostUrl,
    convexUrl,
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
    convexUrl: null,
    convexQueryClient: null,
    authClient: null,
    queryClient,
  })
}

if (typeof window !== 'undefined') {
  const storedHostUrl =
    window.localStorage.getItem('hostUrl') ?? 'http://localhost:3000'
  const storedConvexUrl =
    window.localStorage.getItem('convexUrl') ?? 'http://localhost:3210'
  updateClientStore(storedHostUrl, storedConvexUrl)
}
