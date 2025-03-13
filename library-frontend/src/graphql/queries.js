import { gql } from '@apollo/client';

export const AUTHOR_DETAILS = gql`
  fragment AuthorDetails on Author {
    name
    id
    born
    bookCount
  }
`;

const BOOK_DETAILS = gql`
  fragment BookDetails on Book {
    id
    title
    author {
      id
      name
    }
    published
    genres
  }
`;

export const ALL_AUTHORS = gql`
  query {
    allAuthors {
      ...AuthorDetails
    }
  }
  ${AUTHOR_DETAILS}
`;

export const ALL_BOOKS = gql`
  query {
    allBooks {
      ...BookDetails
    }
  }
  ${BOOK_DETAILS}
`;

export const ALL_BOOKS_WITH_GENRES = gql`
  query allBooksWithGenres(
    $genres: [String!]!
  ) {
    allBooksWithGenres(
      genres: $genres
    ) {
      ...BookDetails
    }
  }
  ${BOOK_DETAILS}
`;

export const ALL_GENRES = gql`
  query {
    allGenres
  }
`;

export const BOOK_ADDED = gql`
  subscription {
    bookAdded {
      id
      title
      author {
       ...AuthorDetails
      }
      published
      genres
    }
  }
  ${AUTHOR_DETAILS}
`;

export const MY_FAVORITES = gql`
  query {
    myFavorites {
      favoriteGenre
      favorites {
        ...BookDetails
      }
    }
  }
  ${BOOK_DETAILS}
`;
