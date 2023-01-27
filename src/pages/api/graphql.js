import Cors from 'micro-cors'
import { gql, ApolloServer } from 'apollo-server-micro'
import { Client, Collection, Documents, Lambda, Paginate, Map, Get, Collections } from 'faunadb'

const client = new Client({
    secret: process.env.FAUNA_SECRET,
    domain: 'db.fauna.com',
})

export const config = {
    api: {
        bodyParser: false
    }
}

const typeDefs = gql`
type Book {
    title: String
    author: String
}

type Query {
    books: [Book]
}
`
const resolvers = {
    Query: {
        books: async () => {
            const response = await client.query(
                Map(
                    Paginate(Documents(Collection('Books'))),
                    Lambda((x) => Get(x))
                )
            )
            const books = response.data.map(item => item.data)
            return [...books]
            
        },
    },
};

const cors = Cors()

const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {

    },
    introspection: true,
    playground: true,
});

const serverStart = apolloServer.start();
export default cors(async(req, res) => {
    if(req.method === 'OPTIONS') {
        res.end();
        return false;
    }

    await serverStart;
    await apolloServer.createHandler({ path: '/api/graphql' })(req, res)
});