import { useQuery } from '@apollo/client';
import { ALL_AUTHORS } from '../graphql/queries';

const Authors = (props) => {
  const result = useQuery(ALL_AUTHORS);

  if (!props.show) {
    return null
  } else if (result.loading) {
    return <div>Loading authors...</div>;
  }

  const authors = result.called && !result.error
    ? result.data.allAuthors
    : [];

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {authors.map((a) => (
            <tr key={a.id}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Authors
