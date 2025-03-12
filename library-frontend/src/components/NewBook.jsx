import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { ALL_AUTHORS, ALL_BOOKS, ALL_GENRES, MY_FAVORITES } from '../graphql/queries';
import { CREATE_BOOK } from '../graphql/mutations';
import { updateAuthorCache, updateBookCache, updateFavoritesCache, updateGenreCache } from '../App';

const NewBook = (props) => {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [published, setPublished] = useState('')
  const [genre, setGenre] = useState('')
  const [genres, setGenres] = useState([])

  const [createBook] = useMutation(CREATE_BOOK, {
    //refetchQueries: [
    //  { query: ALL_AUTHORS },
    //  { query: ALL_BOOKS },
    //  { query: ALL_GENRES },
    //  { query: MY_FAVORITES },
    //  //{ query: ALL_BOOKS_WITH_GENRES } // Parameterized queries are not cached
    //],
    update: (cache, response) => {
      const addedBook = response.data.addBook;
      updateBookCache(cache, { query: ALL_BOOKS }, addedBook);
      updateGenreCache(cache, { query: ALL_GENRES }, addedBook.genres);
      updateAuthorCache(cache, { query: ALL_AUTHORS }, addedBook.author);
      updateFavoritesCache(cache, { query: MY_FAVORITES }, addedBook);
    }
  });

  if (!props.show) {
    return null
  }

  const submit = async (event) => {
    event.preventDefault()

    // NOTE: This will currently add new books even if it contains empty fields
    createBook({
      variables: {
        title,
        published: Math.round(published),
        author,
        genres
      }
    })

    setTitle('')
    setPublished('')
    setAuthor('')
    setGenres([])
    setGenre('')
  }

  const addGenre = () => {
    setGenres(genres.concat(genre).sort())
    setGenre('')
  }

  return (
    <div>
      <form onSubmit={submit}>
        <div>
          title
          <input
            value={title}
            onChange={({ target }) => setTitle(target.value)}
          />
        </div>
        <div>
          author
          <input
            value={author}
            onChange={({ target }) => setAuthor(target.value)}
          />
        </div>
        <div>
          published
          <input
            type="number"
            value={published}
            onChange={({ target }) => setPublished(target.value)}
          />
        </div>
        <div>
          <input
            value={genre}
            onChange={({ target }) => setGenre(target.value)}
          />
          <button onClick={addGenre} type="button">
            add genre
          </button>
        </div>
        <div>genres: {genres.join(' ')}</div>
        <button type="submit">create book</button>
      </form>
    </div>
  )
}

export default NewBook