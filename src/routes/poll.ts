import { FastifyInstance } from "fastify"
import ShortUniqueId from "short-unique-id"
import { z } from "zod"
import { prisma } from "../lib/prisma"
import { authenticate } from "../plugins/authenticate"

export async function pollRoutes(fastify: FastifyInstance){
    fastify.get('/polls/count',async () => {
        const count = await prisma.poll.count()
        
        return { count }
        
    }) 

    fastify.post('/polls',async (request, reply) => {
        const createPollBody = z.object({
            title: z.string(),
        })
        const {title} = createPollBody.parse(request.body)

        const generate = new ShortUniqueId({length: 6})
        const code = String(generate()).toUpperCase();



        //verificar usersId
        try{ 
            await request.jwtVerify()           
            await prisma.poll.create({
                data:{
                    title,
                    code,
                    ownerId: request.user.sub,

                    participants: {
                        create: {
                            usersId: request.user.sub,
                        }
                    }
                }
            })
        } catch {
            await prisma.poll.create({
                data:{
                    title,
                    code,
                }
            })
        }

        return reply.status(201).send({code})
        //return {title}
    })


    fastify.post('/polls/join', {
        onRequest: [authenticate]
    },async (request,reply) => {
        const joinPollBody = z.object({
            code: z.string(),
        })
        const {code} = joinPollBody.parse(request.body)

        const poll = await prisma.poll.findUnique({
            where: {
                code,
            },
            include: {
                participants: {
                    where:{
                        usersId: request.user.sub,
                    }
                }
            }
        })
        if(!poll){
            return reply.status(400).send({
                message: 'Bolão não encontrado'
            })
        }

        if(poll.participants.length > 0){ //usuario ja participa do bolão
            return reply.status(400).send({
                message: 'Você já participa do bolão'
            })
        }

        if (!poll.ownerId){ //se nao tem dono, o primeiro que logar eh dono
            await prisma.poll.update({
                where:{
                    id: poll.id,
                },
                data: {
                    ownerId: request.user.sub
                }
            })
        }


        await prisma.participant.create({
            data: {
                pollId: poll.id,
                usersId: request.user.sub,
            }
        })

        return reply.status(201).send()
    })

    fastify.get('/polls',{ //parametro de entrada pelo token que tem o userId (sub), user name e user avatarUrl
        onRequest: [authenticate]
    }, async (request) => {
        const polls = await prisma.poll.findMany({ //retorna todos os boloes onde o userID(user.sub) tem participacao
            where: {
                participants: {
                    some: { //algum seja igual
                        usersId: request.user.sub,
                    }
                }
            },
            include: { //faz nao retornar so os polls mas o que estiver aqui tbm, no nosso caso o nome do criador (para a interface)
                
                _count: { //enviar a quantidade de participantes do bolao
                    select: {
                        participants: true,
                    }
                },
                participants:{
                    select: {
                        id: true,
                        user: {
                            select: {
                                avatarUrl: true,
                            }
                        }
                    }, take: 4,
                },
                owner: { //para ter todas as informacoes do dono, owner: true,
                    select: { //filtra qual informação do owner para enviar (caso não tivesse, enviaria todas as informações do owner)
                        name: true,
                        id: true,
                    }
                },
            }
        })
        return {polls}
    })

    fastify.get('/polls/:id', { //detalhes do bolão
        onRequest: [authenticate],
    }, async (request) => {
        const getPollParams = z.object({
            id: z.string(),
        })
        const { id } = getPollParams.parse(request.params) // /id do bolao

        const poll = await prisma.poll.findUnique({ //retorna dados do bolao
            where: {
                id, //id: id(request.params)
            },
            include: { //faz nao retornar so os polls mas o que estiver aqui tbm, no nosso caso o nome do criador (para a interface)
                
                _count: { //enviar a quantidade de participantes do bolao
                    select: {
                        participants: true,
                    }
                },
                participants:{
                    select: {
                        id: true,
                        user: {
                            select: {
                                avatarUrl: true,
                            }
                        }
                    }, take: 4,
                },
                owner: { //para ter todas as informacoes do dono, owner: true,
                    select: { //filtra qual informação do owner para enviar (caso não tivesse, enviaria todas as informações do owner)
                        name: true,
                        id: true,
                    }
                },
            }
        })
        console.log('entrou',poll)
        return {poll}
    })


}