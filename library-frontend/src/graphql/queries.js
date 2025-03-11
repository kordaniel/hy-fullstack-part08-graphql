import { gql } from '@apollo/client';

export const ALL_AUTHORS = gql`
  query {
    allAuthors {
      id
      name
      born
      bookCount
    }
  }
`;

export const ALL_BOOKS = gql`
  query {
    allBooks {
      id
      title
      author {
        name
      }
      published
      genres
    }
  }
`;

export const ALL_BOOKS_WITH_GENRES = gql`
  query allBooksWithGenres(
    $genres: [String!]!
  ) {
    allBooksWithGenres(
      genres: $genres
    ) {
      id
      title
      author {
        name
      }
      published
      genres
    }
  }
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
        name
      }
      published
      genres
    }
  }
`;

export const MY_FAVORITES = gql`
  query {
    myFavorites {
      favoriteGenre
      favorites {
        id
        title
        author {
          name
        }
        published
        genres
      }
    }
  }
`;
