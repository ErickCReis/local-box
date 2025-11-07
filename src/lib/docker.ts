import { createServerOnlyFn } from '@tanstack/react-start'

export const DOCKER = {
  getDockerStatus: createServerOnlyFn(async () => {
    const result = await Bun.$`docker compose ps --format json`.text()
    return result
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
  }),
}
