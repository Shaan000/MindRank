# Truth-Teller/Liar Puzzle Modules

This directory contains four Python modules that generate and validate logic puzzles involving Truth-Tellers and Liars using Z3 constraint solving.

## Modules

### 1. `easy_mode.py`
- **Statements**: Simple DIRECT statements only
- **Example**: "B is a Truth-Teller." or "C is a Liar."
- **Functions**: `api_generate_easy(num_players)`, `check_easy_solution(data)`

### 2. `medium_mode.py`
- **Statements**: DIRECT, AND, OR statements
- **Example**: "A is a Truth-Teller AND B is a Liar." or "C is a Truth-Teller OR D is a Truth-Teller."
- **Functions**: `api_generate_medium(num_players)`, `check_medium_solution(data)`

### 3. `hard_mode.py`
- **Statements**: DIRECT, AND, OR, IF statements (at least one IF required)
- **Example**: "If A is True, then B is False."
- **Functions**: `api_generate_hard(num_players)`, `check_hard_solution(data)`

### 4. `extreme_mode.py`
- **Statements**: All advanced operators including XOR, IFF, NESTED_IF, SELF_REF, GROUP
- **Example**: "A is a Truth-Teller XOR B is a Truth-Teller." or "Exactly 2 of {A, B, C} are Truth-Tellers."
- **Functions**: `api_generate_extreme(num_players)`, `check_extreme_solution(data)`

## Usage

### Generate a Puzzle
```python
from puzzle_modes import api_generate_easy

# Generate a puzzle with 5 players
puzzle = api_generate_easy(5)
print(puzzle['statements'])
print(puzzle['solution'])
```

### Check a Solution
```python
from puzzle_modes import check_easy_solution

data = {
    "statement_logic": puzzle["statement_logic"],
    "num_truth_tellers": puzzle["num_truth_tellers"], 
    "guess": {"A": True, "B": False, "C": True, "D": False, "E": True}
}

result = check_easy_solution(data)
print(result['valid'])  # True if solution is correct
```

## Data Format

### Generation Output
```json
{
    "num_players": 5,
    "num_truth_tellers": 3,
    "statements": {
        "A": "B is a Truth-Teller.",
        "B": "C is a Liar.",
        ...
    },
    "statement_logic": {
        "A": {"mode": "DIRECT", "target": "B", "claim": true},
        "B": {"mode": "DIRECT", "target": "C", "claim": false},
        ...
    },
    "solution": {
        "A": true,
        "B": false, 
        "C": true,
        ...
    }
}
```

### Validation Input
```json
{
    "statement_logic": { ... },
    "num_truth_tellers": 3,
    "guess": {
        "A": true,
        "B": false,
        ...
    }
}
```

### Validation Output
```json
{
    "valid": true
}
```

## Logic Operators

- **DIRECT**: Simple statements about one person
- **AND**: Both conditions must be true
- **OR**: At least one condition must be true
- **IF**: Conditional implication
- **XOR**: Exactly one condition must be true
- **IFF**: Biconditional (if and only if)
- **NESTED_IF**: Nested conditional statements
- **SELF_REF**: Self-referential statements
- **GROUP**: Counting constraints on groups

## Requirements

- Python 3.6+
- z3-solver package (`pip install z3-solver`)

## Testing

Run the test script to verify all modules:
```bash
python test_modules.py
```

## Features

- Generic labels (A, B, C, ...)
- Configurable number of players
- Automatic truth-teller count calculation: `max(2, round(0.6 * num_players))`
- Constraint satisfaction using Z3
- JSON-serializable output
- Identical logic in generation and validation functions 