import { Elysia } from 'elysia'
import { jobRoutes } from './routes/job.routes'

const app = new Elysia()
  .group('/api', (app) => app.use(jobRoutes))
  .listen(3001)

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)

export type App = typeof app
