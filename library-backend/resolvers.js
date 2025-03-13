const config = require('./utils/config');

const { GraphQLError } = require('graphql');
const { PubSub } = require('graphql-subscriptions');
const jwt = require('jsonwebtoken');

const Author = require('./models/author');
const Book = require('./models/book');
const User = require('./models/user');

const pubsub = new PubSub();

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

      pubsub.publish('BOOK_ADDED', { bookAdded: book });

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
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterableIterator('BOOK_ADDED')
    }
  },
  Query: {
    bookCount: async () => Book.collection.countDocuments(),
    authorCount: async () => Author.collection.countDocuments(),
    allAuthors: async () => {
      // Another option would be to introduce a virtual field bookCount for
      // mongoose model Author, which references Book (author) and counts the
      // occurences. Then populate the virtual field before returning list of authors.

      // Run aggregation query to avoid N+1 problem
      const authors = await Author.aggregate([
        { $lookup: { from: 'books', localField: '_id', foreignField: 'author', as: 'authorsBooks' } },
        { $addFields: { bookCount: { $size: '$authorsBooks' } } },
        { $project: { authorsBooks: 0 } }
      ]);

      return authors.map(authorObj => {
        const authorObjToReturn = { ...authorObj, id: authorObj._id.toString() };
        delete authorObjToReturn._id;
        delete authorObjToReturn.__v;
        return authorObjToReturn;
      });
    },
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
    allBooksWithGenres: async (_root, args) => {
      return Book.find({ genres: { $in: args.genres } });
    },
    allGenres: async () => {
      // NOTE: This returns the genres in ascending order so it contains more logic than
      //       the exercise required.
      // https://mongoosejs.com/docs/api/aggregate.html

      const aggregatedGenres = await Book.aggregate([
        { $unwind: '$genres' }, // extracts a new document for every genre in every book documents genres
        //                         array, where each new document holds all the fields of the original book
        //                         document, but with the genres array mapped to the extracted genre string
        { $group: { _id: null, genres: { $addToSet: '$genres' } } }, // collect all the different
        // genres into one document with the field 'genres' holding an array of all unique genres
        // without duplicates
        { $project: { _id: 0, genres: 1 } }, // drop _id field, keep genres
        { $unwind: '$genres' }, // extract a document for every genre
        { $sort: { genres: 1 } } // sort the documents, 1 = ascending
      ]);

      return aggregatedGenres.map(g => g.genres);
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
    myFavorites: async (_root, _args, { currentUser }) => {
      if (!currentUser) {
        throw new GraphQLError('not authenticated', {
          extensions: {
            code: 'BAD_USER_INPUT'
          }
        });
      }

      return {
        favoriteGenre: currentUser.favoriteGenre,
        favorites: await Book.find({ genres: currentUser.favoriteGenre })
      };
    },
  },
  Author: {
    bookCount: async (root) => {
      if (root.hasOwnProperty('bookCount')) {
        // allAuthors resolver performs one aggregation query
        //  => this field is set in root Author object
        //  => n+1 query avoided
        return root.bookCount;
      }
      // This is run when books/authors are added => 2 queries in total

      //console.log('Running separate query for Author.bookCount, root:', root);
      //console.log('bookCount:info:', info.fieldNodes.some(field => {
      //  return field.name.value === 'bookCount';
      //}));
      return await Book.find({ author: root._id }).countDocuments();
    },
  },
  Book: {
    author: async (root) => Author.findById(root.author),
  }
};

module.exports = resolvers;
