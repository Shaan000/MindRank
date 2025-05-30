import { useState } from 'react';

function GuessForm({ onSubmit, onGiveUp }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // If the user types "I give up", trigger the give-up flow
    if (input.trim().toLowerCase() === 'i give up') {
      onGiveUp();
      setInput('');
      return;
    }

    try {
      const guessPairs = input
        .toUpperCase()
        .split(',')
        .map(pair => pair.trim().split(' '))
        .filter(pair => pair.length === 2 && (pair[1] === 'T' || pair[1] === 'F'));

      const guessObj = {};
      for (const [person, role] of guessPairs) {
        guessObj[person] = role === 'T';
      }

      onSubmit(guessObj);
      setInput(''); // clear the field
    } catch (error) {
      alert('⚠️ Invalid format. Please use A T, B F, C T');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
      <label>
        <strong>Enter your guess:</strong> (e.g. A T, B F, C T or type "I give up")
        <br />
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="A T, B F, C T"
          style={{ width: '60%', padding: '0.5rem', marginTop: '0.5rem' }}
        />
      </label>
      <br />
      <button type="submit" style={{ marginTop: '1rem' }}>
        Submit Guess
      </button>
    </form>
  );
}

export default GuessForm;