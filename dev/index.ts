import path from 'node:path'

const server = Bun.serve({
    port: 7819,
    fetch(request, server) {
        if (request.url.endsWith('tbin.js')) {
            console.log('serving tbin.js')
            return new Response(Bun.file(path.join(import.meta.dir, '../build/index.js')))
        }
        return new Response(Bun.file(import.meta.dir + '/index.html'))
    },
})

console.log(`server running on ${server.url}`)