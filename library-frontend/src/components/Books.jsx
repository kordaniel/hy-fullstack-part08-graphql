import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { ALL_BOOKS, ALL_BOOKS_WITH_GENRES, ALL_GENRES } from '../graphql/queries';

const GenreSelection = ({ allGenres, showGenres, setShowGenres }) => {
  const handleChange = (event) => {
    if (event.target.checked) {
      setShowGenres([...showGenres, event.target.id]);
    } else {
      setShowGenres(showGenres.filter(g => g !== event.target.id));
    }
  };

  return (
    <div>
      <fieldset>
        <legend>Select genres to show:</legend>
        {allGenres.map(genre => (
          <div key={genre}>
            <input type="checkbox" id={genre} onChange={handleChange} />
            <label htmlFor={genre}>{genre}</label>
          </div>
        ))}
      </fieldset>
    </div>
  );
};

const ListBooks = ({ books, showGenres }) => {
  const booksWithGenre = useQuery(ALL_BOOKS_WITH_GENRES, {
    variables: { genres: showGenres }
  });

  const booksToShow = !booksWithGenre.loading &&
                       booksWithGenre.called &&
                      !booksWithGenre.error &&
                       showGenres.length > 0
    ? booksWithGenre.data.allBooksWithGenres
    : books;

  return (
    <div>
      {showGenres.length > 0
        ? <span>in genres: <strong>{showGenres.join(', ')}</strong>.</span>
        : <span>in <strong>all</strong> genres.</span>
      }
      <table>
        <tbody>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Published</th>
            <th>Genres</th>
          </tr>
          {booksToShow.map((a) => (
            <tr key={a.id}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
              <td>{a.genres.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Books = (props) => {
  const books = useQuery(ALL_BOOKS);
  const genres = useQuery(ALL_GENRES);
  const [showGenres, setShowGenres] = useState([]);

  useEffect(() => {
    if (!props.show) {
      setShowGenres([]);
    }
  }, [props.show]);

  if (!props.show) {
    return null
  }
  if (books.loading || genres.loading) {
    return <div>Loading books and genres...</div>;
  }

  const allBooks = books.called && !books.error
    ? books.data.allBooks
    : [];
  const allGenres = genres.called && !genres.error
    ? genres.data.allGenres
    : [];

  return (
    <div>
      <h2>Books</h2>
      <div style={{ display: 'flex', gap: 10 }}>
        <GenreSelection allGenres={allGenres} showGenres={showGenres} setShowGenres={setShowGenres} />
        <ListBooks books={allBooks} showGenres={showGenres} />
      </div>
    </div>
  )
}

export default Books
