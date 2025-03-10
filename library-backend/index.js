const config = require('./utils/config');

const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { GraphQLError } = require('graphql');
const jwt = require('jsonwebtoken');

const Author = require('./models/author');
const Book = require('./models/book');
const User = require('./models/user');


console.log('Connecting to MongDB:', config.MONGOOSE_URI);
mongoose.connect(config.MONGOOSE_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(error => {
    console.error('Error connecting to MongoDB:', error.message);
  });

const typeDefs = `
  type Author {
    name: String!
    id: ID!
    born: Int
    bookCount: Int!
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    id: ID!
    genres: [String!]!
  }

  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Mutation {
    addBook(
      title: String!
      published: Int!
      author: String!
      genres: [String!]!
    ): Book
    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author
    login(
      username: String!
      password: String!
    ): Token
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allAuthors: [Author!]!
    allBooks(author: String, genre: String): [Book!]!
    me: User
  }
`;

const resolvers = {
  Mutation: {
    addBook: async (_root, args, { currentUser }) => {
      if (!currentUser) {
        throw new GraphQLError('not authenticated', {
          extensions: {
            code: 'BAD_USER_INPUT'
          }
        });
      }

      const authorInDb = await Author.findOne({ name: args.author });
      let author;

      if (authorInDb) {
        author = authorInDb;
      } else {
        const newAuthor = new Author({ name: args.author });
        try {
          await newAuthor.save();
        } catch (error) {
          throw new GraphQLError('Saving author failed', {
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: args.author,
              error
            }
          });
        }
        author = newAuthor;
      }

      const book = new Book({ ...args, author: author._id });

      try {
        await book.save();
      } catch (error) {
        throw new GraphQLError('Saving book failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args,
            error
          }
        });
      }

      return book;
    },
    createUser: async (_root, args) => {
      const user = new User({
        username: args.username,
        favoriteGenre: args.favoriteGenre
      });

      return user.save().catch(error => {
        throw new GraphQLError('Creating new user failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args,
            error
          }
        });
      });
    },
    editAuthor: async (_root, args, { currentUser }) => {
      if (!currentUser) {
        throw new GraphQLError('not authenticated', {
          extensions: {
            code: 'BAD_USER_INPUT'
          }
        });
      }

      const author = await Author.findOne({ name: args.name });
      if (!author) {
        return null;
      }
      author.born = args.setBornTo;
      try {
        await author.save();
      } catch (error) {
        throw new GraphQLError('Updating author born field failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.setBornTo,
            error
          }
        });
      }
      return author;
    },
    login: async (_root, args) => {
      const user = await User.findOne({ username: args.username });

      if (!user || args.password !== 'secret') {
        throw new GraphQLError('wrong credentials', {
          extensions: {
            code: 'BAD_USER_INPUT'
          }
        });
      }

      const userForToken = {
        username: user.username,
        id: user._id
      };

      return { value: jwt.sign(userForToken, config.JWT_SECRET) };
    }
  },
  Query: {
    bookCount: async () => Book.collection.countDocuments(),
    authorCount: async () => Author.collection.countDocuments(),
    allAuthors: async () => Author.find({}),
    allBooks: async (_root, args) => {
      let opts = {};

      if (args.author) {
        // author field 'name' has unique constraint!
        const author = await Author.findOne({ name: args.author });
        opts.author = author?._id;
      }

      if (args.genre) {
        opts.genres = args.genre; // mongoose internally treats this as:
        //opts.genres = { $in: [ args.genre, ] };
      }

      return Book.find(opts);
    },
    me: (_root, _args, context) => {
      if (!context.currentUser) {
        throw new GraphQLError('not authenticated', {
          extensions: {
            code: 'BAD_USER_INPUT'
          }
        });
      }
      return context.currentUser;
    },
  },
  Author: {
    bookCount: async (root) => await Book.find({ author: root._id }).countDocuments(),
  },
  Book: {
    author: async (root) => Author.findById(root.author),
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

startStandaloneServer(server, {
  listen: { port: config.PORT },
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null;
    if (auth && auth.startsWith('Bearer ')) {
      const decodedToken = jwt.verify(auth.substring(7), config.JWT_SECRET);
      const currentUser = await User.findById(decodedToken.id);
      return { currentUser };
    }
  },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
