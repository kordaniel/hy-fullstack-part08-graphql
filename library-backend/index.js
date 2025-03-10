const config = require('./utils/config');

const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');

const Author = require('./models/author');
const Book = require('./models/book');


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

  type Mutation {
    addBook(
      title: String!
      published: Int!
      author: String!
      genres: [String!]!
    ): Book
    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allAuthors: [Author!]!
    allBooks(author: String, genre: String): [Book!]!
  }
`;

const resolvers = {
  Mutation: {
    addBook: async (_root, args) => {
      const authorInDb = await Author.findOne({ name: args.author });
      const author = authorInDb
        ? authorInDb
        : await new Author({ name: args.author }).save();
      const book = new Book({ ...args, author: author._id });
      await book.save(); // unnecessary await(?)

      return book;
    },
    editAuthor: async (_root, args) => {
      const author = await Author.findOne({ name: args.name });
      if (!author) {
        return null;
      }
      author.born = args.setBornTo;
      await author.save();
      return author;
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
}).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
