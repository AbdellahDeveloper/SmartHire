import { Elysia } from 'elysia'
import { readFileSync } from 'fs'
import { join } from 'path'

const app = new Elysia()

const htmlPath = join(process.cwd(), 'index.html')

app.get('/', () => {
  return new Response(readFileSync(htmlPath), {
    headers: { 'Content-Type': 'text/html' }
  })
})

app.listen(3051)

console.log('WebChat Is Running on http://localhost:3051')
