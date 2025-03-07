import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { UPDATE_AUTHOR } from '../graphql/mutations';
import { ALL_AUTHORS } from '../graphql/queries';

const EditAuthor = (props) => {
  const [name, setName] = useState('');
  const [birthyear, setBirthyear] = useState('');

  const allAuthors = useQuery(ALL_AUTHORS);
  const [updateAuthor] = useMutation(UPDATE_AUTHOR, {
    refetchQueries: [
      { query: ALL_AUTHORS }
    ]
  });

  if (!props.show) {
    return null;
  } else if (allAuthors.loading) {
    return <div>Loading authors...</div>;
  }

  const authors = allAuthors.called && !allAuthors.error
    ? allAuthors.data.allAuthors
    : [];

  const submit = async (event) => {
    event.preventDefault();

    if (!name || !birthyear || !Math.round(birthyear)) {
      return;
    }

    updateAuthor({
      variables: {
        name,
        setBornTo: Math.round(birthyear)
      }
    });

    setName('');
    setBirthyear('');
  };

  return (
    <div>
      <h2>Set birthyear</h2>
      <form onSubmit={submit}>
        <div>
          name
          <select value={name} onChange={({ target }) => setName(target.value)}>
            <option value=''>Select author from dropdown..</option>
            {authors.map(a => (
              <option key={a.id} value={a.name}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          born
          <input
            type="number"
            value={birthyear}
            onChange={({ target }) => setBirthyear(target.value)}
          />
        </div>
        <button disabled={!name} type="submit">update author</button>
      </form>
    </div>
  );
};

export default EditAuthor;
