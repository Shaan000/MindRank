# IF-THEN Logic in Hard Mode Puzzles

## Understanding IF-THEN Statements

An IF-THEN statement (implication) has the form: **"If P, then Q"**

### Truth Table for Implications

| P (condition) | Q (result) | "If P, then Q" |
|---------------|------------|----------------|
| True          | True       | **True** ✓     |
| True          | False      | **False** ❌   |
| False         | True       | **True** ✓     |
| False         | False      | **True** ✓     |

**Key Rule**: An implication is FALSE only when the condition is TRUE but the result is FALSE.

## Truth-Tellers vs. Liars

### Truth-Teller Says "If P, then Q"
- The implication must be TRUE
- This means: NOT (P is true AND Q is false)

### Liar Says "If P, then Q"  
- The implication must be FALSE
- This means: P is true AND Q is false

## Examples

### Example 1: Truth-Teller's IF Statement
**Setup**: A is Truth-Teller, B is Truth-Teller, C is Liar
**A says**: "If B is True, then C is True"

**Analysis**:
- A is truth-teller, so the implication must be TRUE
- B is True, C is False
- "If True, then False" = FALSE
- But A (truth-teller) said something FALSE → **CONTRADICTION!**

**Fixed Version**: A says "If B is True, then C is False"
- "If True, then False" = FALSE... wait, still wrong!

**Actually Fixed**: A says "If B is False, then C is True"  
- "If False, then True" = TRUE ✓

### Example 2: Liar's IF Statement
**Setup**: A is Liar, B is Truth-Teller, C is Liar
**A says**: "If B is True, then C is True"

**Analysis**:
- A is liar, so the implication must be FALSE
- B is True, C is False  
- "If True, then False" = FALSE ✓
- A (liar) said something FALSE → **CONSISTENT!**

## Proper Generation Algorithm

When generating "Speaker says 'If X is [val1], then Y is [val2]'":

### Step 1: Determine what the implication should evaluate to
- If Speaker is Truth-Teller → implication should be TRUE
- If Speaker is Liar → implication should be FALSE

### Step 2: Choose condition and result persons
- Pick X and Y from other players (not Speaker)

### Step 3: Generate consistent values
- Get actual values: X_actual, Y_actual (from the solution)

#### For Truth-Teller (implication must be TRUE):
Choose val1, val2 such that "If X is val1, then Y is val2" is TRUE:
- Option A: val1 = False (makes implication always true regardless of val2)
- Option B: val1 = True AND val2 = Y_actual (makes implication true)
- **Avoid**: val1 = True AND val2 ≠ Y_actual (makes implication false)

#### For Liar (implication must be FALSE):
Choose val1, val2 such that "If X is val1, then Y is val2" is FALSE:
- **Must use**: val1 = X_actual AND val2 ≠ Y_actual
- This is the ONLY way to make an implication false

## Example Generations

### Valid Truth-Teller IF Statements
```
Setup: A=T, B=T, C=F, D=T
A (truth-teller) could say:
✓ "If B is False, then C is True"     → If F, then T = T ✓
✓ "If C is False, then D is True"     → If T, then T = T ✓  
✓ "If D is True, then B is True"      → If T, then T = T ✓
✗ "If B is True, then C is True"      → If T, then F = F ❌
```

### Valid Liar IF Statements  
```
Setup: A=F, B=T, C=F, D=T
A (liar) could say:
✓ "If B is True, then C is True"      → If T, then F = F ✓
✓ "If B is True, then D is False"     → If T, then F = F ✓
✓ "If D is True, then C is True"      → If T, then F = F ✓
✗ "If B is False, then C is True"     → If F, then T = T ❌
✗ "If C is False, then D is True"     → If T, then T = T ❌
```

## Implementation Rules

1. **Never randomly choose condition/result values**
2. **Always check implication truth value against speaker's role**
3. **For truth-tellers**: Ensure implication evaluates to TRUE
4. **For liars**: Ensure implication evaluates to FALSE (requires specific pattern)
5. **Validate with Z3 solver before accepting puzzle**

## Common Pitfalls

1. **Random Value Selection**: Choosing condition/result values randomly leads to inconsistent puzzles
2. **Ignoring Speaker Role**: Not considering whether speaker is truth-teller or liar when generating statements
3. **Misunderstanding Implication Logic**: Forgetting that "If False, then anything" is always true
4. **Not Validating**: Generating statements without checking logical consistency 