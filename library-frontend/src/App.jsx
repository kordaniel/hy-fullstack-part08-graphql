import { useEffect, useState } from "react";
import { useApolloClient, useSubscription } from "@apollo/client";

import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import EditAuthor from "./components/EditAuthor";
import LoginForm from "./components/LoginForm";
import Recommendations from "./components/Recommendations";

import { ALL_AUTHORS, ALL_BOOKS, ALL_GENRES, BOOK_ADDED, MY_FAVORITES } from "./graphql/queries";

export const updateBookCache = (cache, query, addedBook) => {
  // This implementation is a one-to-one-copy from the course materials
  const uniqueByTitle = (books) => {
    let seen = new Set();
    return books.filter((item) => {
      let bookTitle = item.title;
      return seen.has(bookTitle) ? false : seen.add(bookTitle);
    });
  };

  cache.updateQuery(query, ({ allBooks }) => {
    return {
      allBooks: uniqueByTitle(allBooks.concat(addedBook))
    };
  });
};

export const updateGenreCache = (cache, query, addedGenres) => {
  cache.updateQuery(query, ({ allGenres }) => {
    let seen = new Set(allGenres);
    return {
      allGenres: [...allGenres, ...addedGenres.filter(g => !seen.has(g))].sort()
    };
  });
};

export const updateAuthorCache = (cache, query, addedAuthor) => {
  // NOTE: This function should only be used to update authors when a new
  //       author (trough a new book) is added. It does not mutate the
  //       authors after editing them (birthyear)
  cache.updateQuery(query, ({ allAuthors }) => {
    return {
      allAuthors: allAuthors.some(a => a.id === addedAuthor.id)
        ? allAuthors
        : allAuthors.concat(addedAuthor)
    };
  });
};

export const updateFavoritesCache = (cache, query, addedBook) => {
  cache.updateQuery(query, ({ myFavorites }) => {
    return {
      myFavorites: !addedBook.genres.some(genre => genre === myFavorites.favoriteGenre)
        ? myFavorites
        : {
            ...myFavorites,
            favorites: myFavorites.favorites.some(book => book.id === addedBook.id)
              ? myFavorites.favorites
              : myFavorites.favorites.concat(addedBook)
        }
    };
  });
}

const App = () => {
  const [token, setToken] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [page, setPage] = useState("authors");
  const client = useApolloClient();

  useSubscription(BOOK_ADDED, {
    onData: ({ data }) => {
      const addedBook = data.data.bookAdded;
      updateBookCache(client.cache, { query: ALL_BOOKS }, addedBook);
      updateGenreCache(client.cache, { query: ALL_GENRES }, addedBook.genres);
      updateAuthorCache(client.cache, { query: ALL_AUTHORS }, addedBook.author);
      if (token) {
        updateFavoritesCache(client.cache, { query: MY_FAVORITES }, addedBook);
      }
    },
    onError: (error) => {
      console.error('error:', error);
    }
  });

  useEffect(() => {
    client.resetStore(); // Need to clear cache since favorites cache is not updated
                         // trough subscription if updates are sent by the server when
                         // user is not logged in. TODO: refresh only fav cache
  }, [token]);

  const logout = () => {
    setPage("authors");
    localStorage.clear();
    setToken(null);
    //client.resetStore(); // Handled in useEffect
  }

  const errorStyle = {
    color: 'red',
    background: 'lightgrey',
    fontSize: 20,
    borderStyle: 'solid',
    borderRadius: '5',
    padding: 10,
    marginTop: 10,
    marginBottom: 10
  };

  return (
    <div>
      <div>
        <button onClick={() => setPage("authors")}>authors</button>
        {token && <button onClick={() => setPage("editAuthor")}>update author</button>}
        <button onClick={() => setPage("books")}>books</button>
        {token && <button onClick={() => setPage("add")}>add book</button>}
        {token && <button onClick={() => setPage("recommendations")}>recommend</button>}
        {token
          ? <button onClick={logout}>logout</button>
          : <button onClick={() => setPage("login")}>login</button>
        }
      </div>

      {errorMessage &&
        <div style={errorStyle}>{errorMessage}</div>
      }

      <Authors show={page === "authors"} />

      <EditAuthor show={page === "editAuthor"} />

      <Books show={page === "books"} />

      <NewBook show={page === "add"} />

      <Recommendations show={page === "recommendations"} skip={token === null} />

      <LoginForm
        show={page === "login"}
        setToken={setToken}
        setError={setErrorMessage}
        setPage={setPage}
      />
    </div>
  );
};

export default App;
