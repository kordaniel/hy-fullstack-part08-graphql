import { gql, useQuery } from '@apollo/client';

const ALL_BOOKS = gql`
  query {
    allBooks {
      id
      title
      author
      published
    }
  }
`;

const Books = (props) => {
  const result = useQuery(ALL_BOOKS);

  if (!props.show) {
    return null
  } else if (result.loading) {
    return <div>Loading books...</div>;
  }

  const books = result.called && !result.error
    ? result.data.allBooks
    : [];

  return (
    <div>
      <h2>books</h2>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map((a) => (
            <tr key={a.id}>
              <td>{a.title}</td>
              <td>{a.author}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Books
