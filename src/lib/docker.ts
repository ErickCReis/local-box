import { join } from 'node:path'
import { cwd } from 'node:process'
import { createServerOnlyFn } from '@tanstack/react-start'
import Docker from 'dockerode'

const PROJECT_NAME = 'local-box'
const NETWORK_NAME = PROJECT_NAME
const LABEL_PROJECT = 'com.local-box.project'
const LABEL_SERVICE = 'com.local-box.service'

// Initialize docker client
const getDocker = () => {
  const dockerHost = process.env.DOCKER_HOST
  if (dockerHost) {
    return new Docker({ host: dockerHost })
  }
  return new Docker({ socketPath: '/var/run/docker.sock' })
}

// Helper to find container by name
async function findContainerByName(
  docker: Docker,
  name: string,
): Promise<Docker.Container | null> {
  try {
    const containers = await docker.listContainers({ all: true })
    const container = containers.find((c) =>
      c.Names.some((n) => n === `/${name}` || n === name),
    )
    if (container) {
      return docker.getContainer(container.Id)
    }
    return null
  } catch (error) {
    console.error('Error finding container:', error)
    return null
  }
}

// Helper to find network by name
async function findNetworkByName(
  docker: Docker,
  name: string,
): Promise<Docker.Network | null> {
  try {
    const networks = await docker.listNetworks()
    const network = networks.find((n) => n.Name === name)
    if (network) {
      return docker.getNetwork(network.Id)
    }
    return null
  } catch (error) {
    console.error('Error finding network:', error)
    return null
  }
}

// Helper to ensure network exists
async function ensureNetwork(docker: Docker): Promise<Docker.Network> {
  let network = await findNetworkByName(docker, NETWORK_NAME)
  if (!network) {
    network = await docker.createNetwork({
      Name: NETWORK_NAME,
      Driver: 'bridge',
      Labels: {
        [LABEL_PROJECT]: PROJECT_NAME,
      },
    })
  }
  return network
}

// Helper to ensure volume exists
async function ensureVolume(docker: Docker, name: string): Promise<void> {
  try {
    const volume = docker.getVolume(name)
    await volume.inspect()
  } catch (error: any) {
    if (error.statusCode === 404) {
      await docker.createVolume({ Name: name })
    } else {
      throw error
    }
  }
}

// Helper to wait for container health
async function waitForHealth(
  container: Docker.Container,
  timeoutMs: number = 60000,
): Promise<void> {
  const startTime = Date.now()
  while (Date.now() - startTime < timeoutMs) {
    try {
      const inspect = await container.inspect()
      const health = inspect.State.Health
      if (health && health.Status === 'healthy') {
        return
      }
      // If no healthcheck configured, consider running as healthy
      if (!health && inspect.State.Status === 'running') {
        // Wait a bit more to ensure it's actually ready
        await new Promise((resolve) => setTimeout(resolve, 2000))
        return
      }
    } catch (error) {
      // Container might not exist yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  throw new Error('Health check timeout')
}

// Get environment variables with defaults
function getEnvVars() {
  const port = process.env.PORT || '3210'
  const siteProxyPort = process.env.SITE_PROXY_PORT || '3211'
  const dashboardPort = process.env.DASHBOARD_PORT || '6791'
  const caddyPort = process.env.CADDY_PORT || '8080'

  const env: Record<string, string> = {}

  // Passthrough optional env vars
  const optionalEnvs = [
    'ACTIONS_USER_TIMEOUT_SECS',
    'AWS_ACCESS_KEY_ID',
    'AWS_REGION',
    'AWS_S3_DISABLE_CHECKSUMS',
    'AWS_S3_DISABLE_SSE',
    'AWS_S3_FORCE_PATH_STYLE',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_SESSION_TOKEN',
    'DATABASE_URL',
    'DISABLE_BEACON',
    'DO_NOT_REQUIRE_SSL',
    'INSTANCE_NAME',
    'INSTANCE_SECRET',
    'MYSQL_URL',
    'POSTGRES_URL',
    'REDACT_LOGS_TO_CLIENT',
    'RUST_BACKTRACE',
    'S3_ENDPOINT_URL',
    'S3_STORAGE_EXPORTS_BUCKET',
    'S3_STORAGE_FILES_BUCKET',
    'S3_STORAGE_MODULES_BUCKET',
    'S3_STORAGE_SEARCH_BUCKET',
    'S3_STORAGE_SNAPSHOT_IMPORTS_BUCKET',
    'CONVEX_RELEASE_VERSION_DEV',
  ]

  for (const key of optionalEnvs) {
    if (process.env[key]) {
      env[key] = process.env[key]
    }
  }

  // Set defaults for CONVEX URLs
  env.CONVEX_CLOUD_ORIGIN =
    process.env.CONVEX_CLOUD_ORIGIN || `http://127.0.0.1:${port}`
  env.CONVEX_SITE_ORIGIN =
    process.env.CONVEX_SITE_ORIGIN || `http://127.0.0.1:${siteProxyPort}`
  env.NEXT_PUBLIC_DEPLOYMENT_URL =
    process.env.NEXT_PUBLIC_DEPLOYMENT_URL || `http://127.0.0.1:${port}`

  // Set defaults
  env.DOCUMENT_RETENTION_DELAY =
    process.env.DOCUMENT_RETENTION_DELAY || '172800'
  env.RUST_LOG = process.env.RUST_LOG || 'info'

  return { env, port, siteProxyPort, dashboardPort, caddyPort }
}

// Container status type matching UI expectations
type ContainerStatus = {
  ID: string
  Name: string
  Image: string
  Ports: string
  Status: string
  State: string
}

export const DOCKER = {
  up: createServerOnlyFn(async () => {
    const docker = getDocker()
    const { env, port, siteProxyPort, dashboardPort, caddyPort } = getEnvVars()

    // Ensure network exists
    await ensureNetwork(docker)

    // Ensure volumes exist
    await ensureVolume(docker, `${PROJECT_NAME}_data`)
    await ensureVolume(docker, `${PROJECT_NAME}_caddy_data`)
    await ensureVolume(docker, `${PROJECT_NAME}_caddy_config`)

    const confPath = join(cwd(), 'conf')

    // Helper to create or start container
    async function ensureContainer(
      name: string,
      spec: Docker.ContainerCreateOptions,
    ): Promise<Docker.Container> {
      let container = await findContainerByName(docker, name)
      if (!container) {
        // Pull image first
        const image = spec.Image!
        await new Promise<void>((resolve, reject) => {
          docker.pull(image, (err: any, stream: any) => {
            if (err) return reject(err)
            docker.modem.followProgress(stream, (err) => {
              if (err) return reject(err)
              resolve()
            })
          })
        })

        container = await docker.createContainer({
          ...spec,
          name,
        })
        await container.start()
      } else {
        // Update container if needed (simplified - just start if stopped)
        const inspect = await container.inspect()
        if (inspect.State.Status !== 'running') {
          await container.start()
        }
      }
      return container
    }

    // Start backend
    const backendContainer = await ensureContainer(`${PROJECT_NAME}_backend`, {
      Image: 'ghcr.io/get-convex/convex-backend:latest',
      Labels: {
        [LABEL_PROJECT]: PROJECT_NAME,
        [LABEL_SERVICE]: 'backend',
      },
      Env: Object.entries(env).map(([k, v]) => `${k}=${v}`),
      ExposedPorts: {
        '3210/tcp': {},
        '3211/tcp': {},
      },
      HostConfig: {
        PortBindings: {
          '3210/tcp': [{ HostPort: port }],
          '3211/tcp': [{ HostPort: siteProxyPort }],
        },
        Binds: [`${PROJECT_NAME}_data:/convex/data`],
        NetworkMode: NETWORK_NAME,
        // StopSignal: 'SIGINT',
        // StopTimeout: 10,
      },
      Healthcheck: {
        Test: ['CMD', 'curl', '-f', 'http://localhost:3210/version'],
        Interval: 5000000000, // 5s in nanoseconds
        StartPeriod: 10000000000, // 10s in nanoseconds
      },
    })

    // Wait for backend to be healthy
    await waitForHealth(backendContainer)

    // Start dashboard
    await ensureContainer(`${PROJECT_NAME}_dashboard`, {
      Image: 'ghcr.io/get-convex/convex-dashboard:latest',
      Labels: {
        [LABEL_PROJECT]: PROJECT_NAME,
        [LABEL_SERVICE]: 'dashboard',
      },
      Env: [`NEXT_PUBLIC_DEPLOYMENT_URL=${env.NEXT_PUBLIC_DEPLOYMENT_URL}`],
      ExposedPorts: {
        '6791/tcp': {},
      },
      HostConfig: {
        PortBindings: {
          '6791/tcp': [{ HostPort: dashboardPort }],
        },
        NetworkMode: NETWORK_NAME,
        // StopSignal: 'SIGINT',
        // StopTimeout: 10,
      },
    })

    // Start caddy
    await ensureContainer(`${PROJECT_NAME}_caddy`, {
      Image: 'caddy:latest',
      Labels: {
        [LABEL_PROJECT]: PROJECT_NAME,
        [LABEL_SERVICE]: 'caddy',
      },
      ExposedPorts: {
        '80/tcp': {},
      },
      HostConfig: {
        PortBindings: {
          '80/tcp': [{ HostPort: caddyPort }],
        },
        Binds: [
          `${confPath}:/etc/caddy`,
          `${PROJECT_NAME}_caddy_data:/data`,
          `${PROJECT_NAME}_caddy_config:/config`,
        ],
        ExtraHosts: ['host.docker.internal:host-gateway'],
        NetworkMode: NETWORK_NAME,
      },
    })

    return { success: true }
  }),

  down: createServerOnlyFn(async () => {
    const docker = getDocker()

    // Find all containers with our project label
    const containers = await docker.listContainers({
      all: true,
      filters: {
        label: [`${LABEL_PROJECT}=${PROJECT_NAME}`],
      },
    })

    // Stop and remove containers
    for (const containerInfo of containers) {
      const container = docker.getContainer(containerInfo.Id)
      try {
        const inspect = await container.inspect()
        if (inspect.State.Running) {
          await container.stop({ t: 10 })
        }
        await container.remove()
      } catch (error: any) {
        // Ignore if already removed
        if (error.statusCode !== 404) {
          console.error(`Error removing container ${containerInfo.Id}:`, error)
        }
      }
    }

    // Remove network
    const network = await findNetworkByName(docker, NETWORK_NAME)
    if (network) {
      try {
        await network.remove()
      } catch (error: any) {
        // Ignore if network is in use or already removed
        if (error.statusCode !== 404 && error.statusCode !== 409) {
          console.error(`Error removing network ${NETWORK_NAME}:`, error)
        }
      }
    }

    // Note: Volumes are preserved (compose default behavior)

    return { success: true }
  }),

  getStatus: createServerOnlyFn(async (): Promise<Array<ContainerStatus>> => {
    const docker = getDocker()

    try {
      const containers = await docker.listContainers({
        all: true,
        filters: {
          label: [`${LABEL_PROJECT}=${PROJECT_NAME}`],
        },
      })

      return containers.map((container) => {
        const ports = container.Ports.map(
          (p) => `${p.PublicPort || ''}:${p.PrivatePort}/${p.Type || 'tcp'}`,
        ).join(', ')

        return {
          ID: container.Id.substring(0, 12),
          Name: container.Names[0]?.replace(/^\//, '') || container.Id,
          Image: container.Image,
          Ports: ports || '-',
          Status: container.Status,
          State: container.State,
        }
      })
    } catch (error) {
      console.error('Error getting docker status:', error)
      return []
    }
  }),
}
