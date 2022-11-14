import { FastifyInstance } from "fastify"
import { z } from "zod"
import { prisma } from "../lib/prisma"
import { authenticate } from "../plugins/authenticate"

export async function guessRoutes(fastify: FastifyInstance){
    fastify.get('/guesses/count',async () => {
        const count = await prisma.guess.count()
        return { count }
    }) 


    fastify.post('/polls/:pollId/games/:gameId/guesses',{ //criar palpite (vindo pelo body) de determinado bolão, de determinado jogo e de determinado usuario
        onRequest: [authenticate] //determinando o usuario
    }, async (request,reply) => {

        //BOLÃO ID E GAME ID (pelo params)
        const createGuessParams = z.object({
            pollId: z.string(),
            gameId: z.string(),
        })
        const {pollId,gameId} = createGuessParams.parse(request.params) //RECEBENDO o bolão e o game

        //PALPITES (pelo body)
        const createGuessBody = z.object({ 
            firstTeamPoints: z.number(),
            secondTeamPoints: z.number(),
        })
        const {firstTeamPoints, secondTeamPoints} = createGuessBody.parse(request.body) //recebendo os palpites
        
        //informaçoes já recebidas

        const participant = await prisma.participant.findUnique({
            where: {
                usersId_pollId: { //filtra se o usuario participa do bolão 
                    pollId,
                    usersId: request.user.sub,
                }
            }
        })
        if (!participant){ //se o usuario nao participa do bolão
            return reply.status(400).send({
                message: "Você não tem permissão pra criar palpite nesse bolão"
            })
        }
        const guess = await prisma.guess.findUnique({ //verifica se já existe um palpite pro game
            where:{
                participantId_gameId: {
                    participantId: participant.id,
                    gameId
                }
            }
        })
        if(guess) {
            return reply.status(400).send({
                message: 'Você já enviou um palpite pra esse jogo no bolão',
            })
        }

        const game = await prisma.game.findUnique({
            where: {
                id: gameId,
            }
        })
        
        if(!game) {
            return reply.status(400).send({
                message: 'Jogo não encontrado',
            })
        }
        if(game.date < new Date()){
            return reply.status(400).send({
                message: 'O horário para enviar palpites para esse game já se encerrou.'
            })
        }
        //CRIANDO O NOVO PALPITE
        await prisma.guess.create({
            data: {
                gameId,
                participantId: participant.id,
                firstTeamPoints,
                secondTeamPoints
            }
        })


        return reply.status(201).send({
            message: 'Palpite criado com sucesso'
        })
    })

}