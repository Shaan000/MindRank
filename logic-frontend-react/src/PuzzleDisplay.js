
function PuzzleDisplay({ puzzle }) {
  return (
    <div style={{ marginTop: '2rem' }}>
      <h2>
        Puzzle ({puzzle.num_players} players, {puzzle.num_truth_tellers} truth-tellers)
      </h2>
      <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
        {Object.entries(puzzle.statements).map(([person, statement]) => (
          <li key={person}>
            <strong>{person}</strong> says: {statement}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PuzzleDisplay;