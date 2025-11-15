import { createServerFn } from '@tanstack/react-start'
import Docker from 'dockerode'
import { DOCKER } from '@/lib/docker'

// --- Docker server functions ---
const getDocker = () => {
  const dockerHost = process.env.DOCKER_HOST
  if (dockerHost) {
    return new Docker({ host: dockerHost })
  }
  return new Docker({ socketPath: '/var/run/docker.sock' })
}

export const dockerUp = createServerFn().handler(async () => {
  return await DOCKER.up()
})

export const dockerDown = createServerFn().handler(async () => {
  return await DOCKER.down()
})

export const getDockerStatus = createServerFn().handler(async () => {
  return await DOCKER.getStatus()
})

export const watchDockerStatus = createServerFn().handler(async function* () {
  let count = 0
  // signal abort is not working, we can not loop forever
  while (count++ < 3) {
    yield await DOCKER.getStatus()
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
})

export const checkDockerDaemon = createServerFn().handler(async () => {
  try {
    const docker = getDocker()
    await docker.ping()
    return { available: true }
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

export const checkDockerImages = createServerFn().handler(async () => {
  try {
    const docker = getDocker()
    const images = await docker.listImages()
    const requiredImages = [
      'ghcr.io/get-convex/convex-backend:latest',
      'ghcr.io/get-convex/convex-dashboard:latest',
      'caddy:latest',
    ]

    const foundImages: Array<string> = []
    const missingImages: Array<string> = []

    for (const requiredImage of requiredImages) {
      const imageName = requiredImage.split(':')[0]
      const tag = requiredImage.split(':')[1] || 'latest'
      const found = images.some((img) => {
        if (!img.RepoTags) return false
        return img.RepoTags.some((tagName) => {
          const [repo, imgTag] = tagName.split(':')
          return repo === imageName && (!tag || imgTag === tag)
        })
      })

      if (found) {
        foundImages.push(requiredImage)
      } else {
        missingImages.push(requiredImage)
      }
    }

    return {
      allPresent: missingImages.length === 0,
      foundImages,
      missingImages,
    }
  } catch (error) {
    return {
      allPresent: false,
      foundImages: [],
      missingImages: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})

