import { createIsomorphicFn } from '@tanstack/react-start'
import { createContext, useContext, useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { getCookie } from '@tanstack/react-start/server'
import type { PropsWithChildren } from 'react'

type HostUrlContextType = {
  hostUrl: string | null
  setHostUrl: (hostUrl: string | null) => void
}

const HostUrlContext = createContext<HostUrlContextType | null>(null)

const getInitialHostUrl = createIsomorphicFn()
  .client(() => Cookies.get('hostUrl') ?? null)
  .server(() => getCookie('hostUrl') ?? null)

export function HostUrlProvider({
  children,
  initialHostUrl,
}: PropsWithChildren<{ initialHostUrl?: string }>) {
  const [hostUrl, setHostUrl] = useState<string | null>(
    initialHostUrl ?? getInitialHostUrl() ?? null,
  )

  useEffect(() => {
    setHostUrl(initialHostUrl ?? getInitialHostUrl() ?? null)
  }, [initialHostUrl])

  useEffect(() => {
    if (hostUrl) {
      Cookies.set('hostUrl', hostUrl)
    } else {
      Cookies.remove('hostUrl')
    }
  }, [hostUrl])

  return (
    <HostUrlContext.Provider value={{ hostUrl, setHostUrl }}>
      {children}
    </HostUrlContext.Provider>
  )
}

export function useHostUrl() {
  const context = useContext(HostUrlContext)
  if (!context) {
    throw new Error('useHostUrl must be used within a HostUrlProvider')
  }
  return context
}
