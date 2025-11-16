import { createContext, useContext, useEffect, useState } from 'react'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { convexClient } from '@convex-dev/better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import { AutumnProvider } from 'autumn-js/react'
import { api } from '@convex/_generated/api'
import type { AuthClient } from '@convex-dev/better-auth/react'
import type { QueryClient } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'

type HostConnectionContextType =
  | {
      state: 'loading' | 'disconnected'
      convexQueryClient?: undefined
      authClient?: undefined
    }
  | {
      state: 'connected'
      convexQueryClient: ConvexQueryClient
      authClient: AuthClient
    }

const HostConnectionContext = createContext<HostConnectionContextType | null>(
  null,
)

export function HostConnectionProvider({
  children,
  hostUrl,
}: PropsWithChildren<{ hostUrl: string | null }>) {
  const queryClient = useQueryClient()

  const [connection, setConnection] = useState<HostConnectionContextType>({
    state: 'loading',
  })
  useEffect(() => {
    setConnection((prev) => {
      return updateClientStore({
        hostUrl,
        queryClient,
        convexQueryClient: prev.convexQueryClient,
      })
    })
  }, [hostUrl, queryClient])

  if (connection.state === 'loading') {
    return <div>Loading...</div>
  }

  if (connection.state === 'disconnected') {
    return <div>Disconnected</div>
  }

  return (
    <HostConnectionContext.Provider value={connection}>
      <ConvexBetterAuthProvider
        client={connection.convexQueryClient!.convexClient}
        authClient={connection.authClient!}
      >
        <AutumnProvider betterAuthUrl={hostUrl || undefined}>
          {children}
        </AutumnProvider>
      </ConvexBetterAuthProvider>
    </HostConnectionContext.Provider>
  )
}

export function useHostConnected() {
  const context = useContext(HostConnectionContext)

  if (!context || context.state !== 'connected') {
    throw new Error(
      'useHostConnected must be used within a connected host connection',
    )
  }

  return context
}

function updateClientStore({
  hostUrl,
  queryClient,
  convexQueryClient,
}: {
  hostUrl: string | null
  queryClient: QueryClient
  convexQueryClient?: ConvexQueryClient
}) {
  try {
    convexQueryClient?.convexClient.clearAuth()
    convexQueryClient?.convexClient.close()
  } catch (error) {
    console.error('Error clearing host connection', error)
  }

  queryClient.clear()

  if (!hostUrl) {
    return { state: 'disconnected' as const }
  }

  const newConvexQueryClient = createClientStore(
    `${hostUrl}/convex-host`,
    queryClient,
  )

  const authClient = createAuthClient({
    baseURL: hostUrl,
    fetchOptions: {
      credentials: 'include',
    },
    plugins: [convexClient()],
  })

  return {
    state: 'connected' as const,
    convexQueryClient: newConvexQueryClient,
    authClient,
  }
}

function createClientStore(convexUrl: string, queryClient: QueryClient) {
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
