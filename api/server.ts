/**
 * local server entry file, for local development
 */
import app from './app.js'
import { createTables, initMockData } from './db/index.js'
import type { Server } from 'http'

let server: Server

async function bootstrap(): Promise<void> {
  await createTables()
  await initMockData()

  const PORT = process.env.PORT || 3001

  server = app.listen(PORT, () => {
    console.log(`Server ready on port ${PORT}`)
  })
}

bootstrap().catch((err: Error) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received')
  if (server) {
    server.close(() => {
      console.log('Server closed')
      process.exit(0)
    })
  } else {
    process.exit(0)
  }
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received')
  if (server) {
    server.close(() => {
      console.log('Server closed')
      process.exit(0)
    })
  } else {
    process.exit(0)
  }
})

export default app
