import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { cwd } from 'node:process'
import { createServerOnlyFn } from '@tanstack/react-start'
import Docker from 'dockerode'

const PROJECT_NAME = 'local-box'

const execAsync = promisify(exec)

// Initialize docker client (still needed for getStatus)
const getDocker = () => {
  const dockerHost = process.env.DOCKER_HOST
  if (dockerHost) {
    return new Docker({ host: dockerHost })
  }
  return new Docker({ socketPath: '/var/run/docker.sock' })
}

// Execute docker compose command
async function execDockerCompose(
  args: Array<string>,
  env: Record<string, string> = {},
): Promise<void> {
  const projectRoot = cwd()
  const dockerHost = process.env.DOCKER_HOST

  // Build environment variables
  const execEnv = {
    ...process.env,
    ...env,
  }

  // Handle DOCKER_HOST for remote Docker daemons
  if (dockerHost) {
    execEnv.DOCKER_HOST = dockerHost
  }

  // Try 'docker compose' first (newer syntax), fallback to 'docker-compose'
  let command = 'docker compose'
  try {
    await execAsync('docker compose version', { env: execEnv })
  } catch {
    command = 'docker-compose'
  }

  const fullCommand = `${command} ${args.join(' ')}`
  const { stderr } = await execAsync(fullCommand, {
    cwd: projectRoot,
    env: execEnv,
  })

  if (stderr && !stderr.includes('Creating') && !stderr.includes('Starting')) {
    console.warn('Docker compose stderr:', stderr)
  }

  return
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
    await Bun.$`docker compose up -d`.text()

    return { success: true }
  }),

  down: createServerOnlyFn(async () => {
    await Bun.$`docker compose down`.text()

    return { success: true }
  }),

  getStatus: createServerOnlyFn(async (): Promise<Array<ContainerStatus>> => {
    const docker = getDocker()

    try {
      // Docker compose adds a label 'com.docker.compose.project' to containers
      // The project name defaults to the directory name (local-box)
      // We can also check for containers with names matching the compose pattern
      const projectRoot = cwd()
      const projectName = projectRoot.split('/').pop() || PROJECT_NAME

      const containers = await docker.listContainers({
        all: true,
        filters: {
          label: [`com.docker.compose.project=${projectName}`],
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
