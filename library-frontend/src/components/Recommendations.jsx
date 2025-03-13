import { useQuery } from '@apollo/client';
import { MY_FAVORITES } from '../graphql/queries';

const Recommendations = (props) => {
  const favorites = useQuery(MY_FAVORITES, {
    skip: props.skip
  });

  if (!props.show) {
    return null;
  } else if (favorites.loading) {
    return <div>Loading your favorites...</div>;
  }

  const favoriteGenre = favorites.called && !favorites.error
    ? favorites.data.myFavorites.favoriteGenre
    : '';
  const recommendations = favorites.called && !favorites.error
    ? favorites.data.myFavorites.favorites
    : [];

  return (
    <div>
      <h2>Recommendations</h2>
      <p>
        Books in your favorite genre <strong>{favoriteGenre}</strong>:
      </p>
      <table>
        <tbody>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Published</th>
            <th>Genres</th>
          </tr>
          {recommendations.map(b => (
            <tr key={b.id}>
              <td>{b.title}</td>
              <td>{b.author.name}</td>
              <td>{b.published}</td>
              <td>{b.genres.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Recommendations;
