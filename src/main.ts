import { createApp } from './app.ts'
import { loadConfig } from './config.ts'
import { serve } from './http.ts'

const config = loadConfig()
await serve(createApp({ config }), config.port)
console.log(`Brightwave orders API on port ${config.port}`)
