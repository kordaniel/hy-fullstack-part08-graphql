import { useState } from "react";
import { useApolloClient, useSubscription } from "@apollo/client";

import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import EditAuthor from "./components/EditAuthor";
import LoginForm from "./components/LoginForm";
import Recommendations from "./components/Recommendations";

import { BOOK_ADDED } from "./graphql/queries";

const App = () => {
  const [token, setToken] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [page, setPage] = useState("authors");
  const client = useApolloClient();

  useSubscription(BOOK_ADDED, {
    onData: ({ data }) => {
      console.log('new book:', data);
      window.alert('New book');
    }
  });

  const logout = () => {
    setToken(null);
    localStorage.clear();
    client.resetStore();
    setPage("authors");
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

      <Recommendations show={page === "recommendations"} />

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
