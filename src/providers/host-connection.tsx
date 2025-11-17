import { createContext, useContext, useEffect, useState } from 'react'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { convexClient } from '@convex-dev/better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import { AutumnProvider } from 'autumn-js/react'
import { Link } from '@tanstack/react-router'
import type { AuthClient } from '@convex-dev/better-auth/react'
import type { QueryClient } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { MinimalLoading } from '@/components/minimal-loading'
import { Button } from '@/components/ui/button'

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
    const prev = connection
    const newConnection = updateClientStore({
      hostUrl,
      queryClient,
      prev,
    })
    setTimeout(() => {
      setConnection(newConnection)
    }, 500)
  }, [hostUrl, queryClient])

  if (connection.state === 'loading') {
    return <MinimalLoading />
  }

  if (connection.state === 'disconnected') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-4 text-center">
          <h1 className="text-xl font-semibold">Connect to a host</h1>
          <p className="text-sm text-muted-foreground">
            To use the dashboard, first connect to a Local Box host.
          </p>
          <Button asChild>
            <Link to="/enter-host">Enter host URL</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <HostConnectionContext.Provider value={connection}>
      <ConvexBetterAuthProvider
        client={connection.convexQueryClient!.convexClient}
        authClient={connection.authClient!}
      >
        <AutumnProvider betterAuthUrl={hostUrl || undefined} includeCredentials>
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
  prev: { convexQueryClient, authClient },
}: {
  hostUrl: string | null
  queryClient: QueryClient
  prev: HostConnectionContextType
}) {
  if (
    convexQueryClient &&
    convexQueryClient.convexClient.url === `${hostUrl}/convex-host`
  ) {
    return { state: 'connected' as const, convexQueryClient, authClient }
  }

  if (!hostUrl) {
    return { state: 'disconnected' as const }
  }

  const newConvexQueryClient = createClientStore(
    `${hostUrl}/convex-host`,
    queryClient,
  )

  const newAuthClient = createAuthClient({
    baseURL: hostUrl,
    fetchOptions: {
      credentials: 'include',
    },
    plugins: [convexClient()],
  })

  return {
    state: 'connected' as const,
    convexQueryClient: newConvexQueryClient,
    authClient: newAuthClient,
  }
}

function createClientStore(convexUrl: string, queryClient: QueryClient) {
  const convexQueryClient = new ConvexQueryClient(convexUrl, {
    verbose: true,
    expectAuth: true,
  })

  queryClient.setDefaultOptions({
    queries: {
      queryKeyHashFn: convexQueryClient.hashFn(),
      queryFn: convexQueryClient.queryFn(),
      gcTime: 5000,
    },
  })

  convexQueryClient.connect(queryClient)

  return convexQueryClient
}
