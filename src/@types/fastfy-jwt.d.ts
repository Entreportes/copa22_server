import '@fastify/jwt'

declare module '@fastify/jwt' {
    interface FastifyJWT {
        user: {
            sub: string; //userId
            name: string; //user name
            avatarUrl: string;
        }
    }
}