import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { pollRoutes } from './routes/pool'
import { authRoutes } from './routes/auth'
import { gameRoutes } from './routes/game'
import { guessRoutes } from './routes/guess'
import { userRoutes } from './routes/user'


async function bootstrap(){
    const fastify = Fastify({
        logger: true,
    })

    await fastify.register(cors, {
        origin: true,
    })
    //localhost:3333/

    //localhost:3333/pools/count

    // RETIRAR EM PRODUÇÃO
    await fastify.register(jwt, {
        secret: 'nlwcopa2',
    })

    await fastify.register(pollRoutes)
    await fastify.register(authRoutes)
    await fastify.register(gameRoutes)
    await fastify.register(guessRoutes)
    await fastify.register(userRoutes)





    
    //await fastify.listen({port: 3333, host: '0.0.0.0'}) //MOBILE
    await fastify.listen({port: 3333, host: '192.168.0.13'})  //WEB
}

bootstrap()
