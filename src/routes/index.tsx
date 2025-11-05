import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import { useEffect, useState } from 'react'

export const dockerUp = createServerFn().handler(async () => {
  const result = await Bun.$`docker compose up -d`
  if (result.exitCode !== 0) {
    throw new Error('Failed to start docker compose')
  }
  return result.text()
})

export const dockerDown = createServerFn().handler(async () => {
  const result = await Bun.$`docker compose down`
  if (result.exitCode !== 0) {
    throw new Error('Failed to stop docker compose')
  }
  return result.text()
})

export const dockerStatus = createServerFn().handler(async function* () {
  let count = 0
  // signal.aborted is not working: https://github.com/TanStack/router/issues/4651
  // while (!signal.aborted) {
  while (count++ < 3) {
    const result = await Bun.$`docker compose ps --format json`
    if (result.exitCode !== 0) {
      throw new Error('Failed to get docker compose status')
    }
    yield result
      .text()
      .trim()
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => {
        const data = JSON.parse(line)
        return {
          ID: data.ID,
          Name: data.Name,
          Image: data.Image,
          Ports: data.Ports,
          Status: data.Status,
          State: data.State,
        }
      })
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
})

export const Route = createFileRoute('/')({
  component: Home,
})

const mutationLogs = {
  onSuccess: () => {
    console.log('Docker compose started')
  },
  onError: (error: Error) => {
    console.error('Failed to start docker compose', error)
  },
}

function Home() {
  const dockerUpFn = useServerFn(dockerUp)
  const dockerUpMutation = useMutation({
    mutationFn: dockerUpFn,
    ...mutationLogs,
  })

  const dockerDownFn = useServerFn(dockerDown)
  const dockerDownMutation = useMutation({
    mutationFn: dockerDownFn,
    ...mutationLogs,
  })

  const [dockerStatusResult, setDockerStatusResult] = useState<Array<any>>([])

  useEffect(() => {
    const controller = new AbortController()

    async function dockerStatusStream() {
      for await (const msg of await dockerStatus({
        signal: controller.signal,
      })) {
        setDockerStatusResult(msg)
      }

      if (!controller.signal.aborted) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        void dockerStatusStream()
      }
    }

    dockerStatusStream()
    return () => controller.abort()
  }, [])

  return (
    <main className="p-8 flex flex-col gap-4">
      <h1 className="text-4xl font-bold text-center">
        Convex + Tanstack Start
      </h1>
      <button onClick={() => dockerUpMutation.mutate({})}>Start Docker</button>
      <button onClick={() => dockerDownMutation.mutate({})}>Stop Docker</button>
      {dockerStatusResult.length > 0 ? (
        <div className="flex flex-col gap-2">
          {dockerStatusResult.map((item) => (
            <div key={item.ID}>
              <h2>{item.Name}</h2>
              <p>{item.Image}</p>
              <p>{item.Ports}</p>
              <p>{item.Status}</p>
              <p>{item.State}</p>
            </div>
          ))}
        </div>
      ) : (
        'No status yet'
      )}
    </main>
  )
}
