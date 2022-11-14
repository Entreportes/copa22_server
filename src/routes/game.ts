import { FastifyInstance } from "fastify"
import { z } from "zod"
import { prisma } from "../lib/prisma"
import { authenticate } from "../plugins/authenticate"

export async function gameRoutes(fastify: FastifyInstance){

    fastify.get('/polls/:id/games',{  //listagem de jogos de um bolão
        onRequest: [authenticate],
    }, async (request) => {
        const getPollsParams = z.object({
            id: z.string(),
        })
        const { id } = getPollsParams.parse(request.params) //id do bolão

        const games = await prisma.game.findMany({
            orderBy: {
                date: 'desc'
            },
            include:{
                guesses: {
                    where: {
                        participant: {
                            usersId: request.user.sub,
                            pollId: id, //tem varios palpites pro mesmo jogo, mas aqui filtramos o palpite do bolao (pollId)
                        }
                    }
                }
            }
        })

        //return {games}
        return {
            games: games.map(game => {
                return {
                    ...game, //returna todos os games
                    guess: game.guesses.length > 0 ? game.guesses[0] : null, //retorna o palpite do usuario pro game
                    guesses: undefined, //
                }
            })
        }
        //RETORNO ESPERADO
        // {
        //     "games": [
        //         {
        //             "id": "cla8q4ef40008vim43080rx4u",
        //             "date": "2022-11-12T12:00:00.930Z",
        //             "firstTeamCountryCode": "BR",
        //             "secondTeamCountryCode": "AR",
        //             "guess": {
        //                 "id": "cla9p8rqr0001vi886x141cd6",
        //                 "firstTeamPoints": 3,
        //                 "secondTeamPoints": 5,
        //                 "createdAt": "2022-11-09T13:51:04.562Z",
        //                 "gameId": "cla8q4ef40008vim43080rx4u",
        //                 "participantId": "cla8sbz8o0003viy0u7hefa34"
        //             }
        //         },
        //         {
        //             "id": "cla8q4eet0006vim4c4cxpzw6",
        //             "date": "2022-11-11T12:00:00.930Z",
        //             "firstTeamCountryCode": "DE",
        //             "secondTeamCountryCode": "BR",
        //             "guess": null
        //         }
        //     ]
        // }
    


    })


}