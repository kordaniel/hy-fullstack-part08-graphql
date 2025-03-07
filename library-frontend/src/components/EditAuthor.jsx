import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { UPDATE_AUTHOR } from '../graphql/mutations';
import { ALL_AUTHORS } from '../graphql/queries';

const EditAuthor = (props) => {
  const [name, setName] = useState('');
  const [birthyear, setBirthyear] = useState('');

  const [updateAuthor] = useMutation(UPDATE_AUTHOR, {
    refetchQueries: [
      { query: ALL_AUTHORS }
    ]
  });

  if (!props.show) {
    return null;
  }

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
          <input
            value={name}
            onChange={({ target }) => setName(target.value)}
          />
        </div>
        <div>
          born
          <input
            value={birthyear}
            onChange={({ target }) => setBirthyear(target.value)}
          />
        </div>
        <button type="submit">update author</button>
      </form>
    </div>
  );
};

export default EditAuthor;
