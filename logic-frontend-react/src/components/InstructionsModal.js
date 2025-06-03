import { useState } from 'react';

export default function InstructionsModal({ mode, isOpen, onClose, skipKey, isManualOpen = false }) {
  const [skipInFuture, setSkipInFuture] = useState(false);

  const handleClose = () => {
    if (skipInFuture && !isManualOpen) {
      localStorage.setItem(skipKey, 'true');
    }
    onClose();
  };

  if (!isOpen) return null;

  const getInstructions = () => {
    switch (mode) {
      case 'easy':
        return {
          title: 'Easy Mode Instructions',
          content: (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#769656', marginBottom: '1rem' }}>🎯 Direct Statements</h3>
                <p>Easy mode features simple, direct statements where players make claims about other players being truth-tellers or liars.</p>
                
                <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#1a1816', borderRadius: '6px', border: '1px solid #3d3a37' }}>
                  <strong>Example Puzzle:</strong><br/>
                  A says: "B is a truth-teller"<br/>
                  B says: "A is a liar"<br/>
                  C says: "B is a liar"
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#769656', marginBottom: '1rem' }}>🔍 Solving Strategy</h3>
                <p><strong>Step 1:</strong> Look for contradictions. In the example above, A and B make opposite claims about each other.</p>
                <p><strong>Step 2:</strong> Test assumptions. If A is a truth-teller, then B must be a truth-teller (A's statement). But if B is a truth-teller, then A must be a liar (B's statement). This is a contradiction!</p>
                <p><strong>Step 3:</strong> Use systematic checking to find the valid solution.</p>
              </div>

              <div>
                <h3 style={{ color: '#769656', marginBottom: '1rem' }}>💡 Easy Mode Tips</h3>
                <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                  <li style={{ marginBottom: '0.5rem' }}>Start with statements that create direct contradictions</li>
                  <li style={{ marginBottom: '0.5rem' }}>Always verify your solution by checking each statement</li>
                  <li style={{ marginBottom: '0.5rem' }}>If a truth-teller makes a statement, it must be true</li>
                  <li>If a liar makes a statement, it must be false</li>
                </ul>
              </div>

              <p style={{ marginTop: '1rem', fontStyle: 'italic' }}><strong>Remember:</strong> Multiple valid solutions are often possible - find any logically consistent assignment!</p>
            </>
          )
        };
      case 'masterEasy':
        return {
          title: 'Master Easy Mode Instructions 🔥',
          content: (
            <>
              <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#ff6b35', borderRadius: '6px', border: '2px solid #ff8c42', color: '#ffffff' }}>
                <p style={{ fontWeight: '700', marginBottom: '0.5rem', fontSize: '1.1rem' }}>🔒 MASTER MODE WARNING</p>
                <p style={{ margin: '0' }}>Once you assign True/False to a player, you CANNOT change it! No takebacks, no second chances. Think carefully before each selection.</p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#769656', marginBottom: '1rem' }}>🎯 Direct Statements (Permanent Mode)</h3>
                <p>Master Easy Mode uses the same direct truth/lie statements as Practice Easy, but with <strong>permanent selections</strong>. This eliminates trial-and-error and forces pure logical reasoning.</p>
                
                <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#1a1816', borderRadius: '6px', border: '1px solid #3d3a37' }}>
                  <strong>Example:</strong><br/>
                  A says: "B is a truth-teller"<br/>
                  B says: "A is a liar"<br/>
                  C says: "B is a liar"
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#769656', marginBottom: '1rem' }}>🧠 Master Strategy</h3>
                <p><strong>Work through the logic completely in your head before making any selections.</strong> Once you click True or False for a player, that choice is locked forever.</p>
                <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                  <li style={{ marginBottom: '0.5rem' }}>Map out all logical dependencies mentally</li>
                  <li style={{ marginBottom: '0.5rem' }}>Identify contradictions before committing</li>
                  <li>Only select when you're certain of the logical chain</li>
                </ul>
              </div>

              <p style={{ fontWeight: 'bold', color: '#ff8c42' }}>Master Mode tests your working memory and pure deductive reasoning - can you solve the puzzle without any trial-and-error?</p>
            </>
          )
        };
      case 'medium':
        return {
          title: 'Medium Mode Instructions',
          content: (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#769656', marginBottom: '1rem' }}>🔧 Logical Operators</h3>
                <p>Medium mode introduces logical operators: <strong>AND</strong> and <strong>OR</strong>. These create compound statements that must be evaluated carefully.</p>
                
                <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#1a1816', borderRadius: '6px', border: '1px solid #3d3a37' }}>
                  <strong>Example Medium Mode Puzzle:</strong><br/>
                  A says: "B is a truth-teller AND C is a liar"<br/>
                  B says: "A is a liar OR C is a truth-teller"<br/>
                  C says: "Either A is a truth-teller OR B is a liar"
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#769656', marginBottom: '1rem' }}>📊 Operator Truth Tables</h3>
                
                <div style={{ background: '#262421', border: '1px solid #3d3a37', borderRadius: '6px', padding: '1rem', margin: '1rem 0', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  <div style={{ color: '#769656', fontWeight: 'bold', marginBottom: '0.5rem' }}>AND (both must be true):</div>
                  <div>True AND True = True</div>
                  <div>True AND False = False</div>
                  <div>False AND True = False</div>
                  <div>False AND False = False</div>
                </div>

                <div style={{ background: '#262421', border: '1px solid #3d3a37', borderRadius: '6px', padding: '1rem', margin: '1rem 0', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  <div style={{ color: '#769656', fontWeight: 'bold', marginBottom: '0.5rem' }}>OR (at least one must be true):</div>
                  <div>True OR True = True</div>
                  <div>True OR False = True</div>
                  <div>False OR True = True</div>
                  <div>False OR False = False</div>
                </div>
              </div>

              <div>
                <h3 style={{ color: '#769656', marginBottom: '1rem' }}>💡 Medium Mode Tips</h3>
                <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                  <li style={{ marginBottom: '0.5rem' }}>AND is only true when ALL parts are true</li>
                  <li style={{ marginBottom: '0.5rem' }}>OR is true when ANY part is true</li>
                  <li style={{ marginBottom: '0.5rem' }}>When a liar makes an AND statement, at least one part must be false</li>
                  <li>When a liar makes an OR statement, all parts must be false</li>
                </ul>
              </div>
            </>
          )
        };
      case 'masterMedium':
        return {
          title: 'Master Medium Mode Instructions 🔥',
          content: (
            <>
              <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#ff6b35', borderRadius: '6px', border: '2px solid #ff8c42', color: '#ffffff' }}>
                <p style={{ fontWeight: '700', marginBottom: '0.5rem', fontSize: '1.1rem' }}>🔒 MASTER MODE WARNING</p>
                <p style={{ margin: '0' }}>Once you assign True/False to a player, you CANNOT change it! No takebacks, no second chances. Think carefully before each selection.</p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#769656', marginBottom: '1rem' }}>🔧 AND/OR Logic (Permanent Mode)</h3>
                <p>Master Medium Mode uses AND/OR logic statements with <strong>permanent selections</strong>. You must solve complex logical relationships without trial-and-error.</p>
                
                <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#1a1816', borderRadius: '6px', border: '1px solid #3d3a37' }}>
                  <strong>Example:</strong><br/>
                  A says: "B is a truth-teller AND C is a liar"<br/>
                  B says: "A is a liar OR C is a truth-teller"
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#769656', marginBottom: '1rem' }}>🧠 Master Strategy</h3>
                <p><strong>Map out the logical dependencies before making any selections.</strong> Each choice permanently constrains the puzzle.</p>
                <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                  <li style={{ marginBottom: '0.5rem' }}>Understand when AND/OR statements are true or false</li>
                  <li style={{ marginBottom: '0.5rem' }}>Consider what happens if a liar makes compound statements</li>
                  <li>Trace through all logical implications before committing</li>
                </ul>
              </div>

              <p style={{ fontWeight: 'bold', color: '#ff8c42' }}>Master Medium tests advanced logical reasoning with complex boolean relationships that require careful mental modeling.</p>
            </>
          )
        };
      case 'hard':
        return {
          title: 'Hard Mode Instructions',
          content: (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#769656', marginBottom: '1rem' }}>⚡ IF-THEN Statements</h3>
                <p>Hard mode introduces conditional statements using <strong>"If X, then Y"</strong> format. These are the most confusing statements in logic puzzles.</p>
                
                <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#1a1816', borderRadius: '6px', border: '1px solid #3d3a37' }}>
                  <strong>Example Hard Mode Puzzle:</strong><br/>
                  A says: "If B is a truth-teller, then C is a liar"<br/>
                  B says: "If A is a liar, then C is a truth-teller"<br/>
                  C says: "If A is a truth-teller, then B is a liar"
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#769656', marginBottom: '1rem' }}>🌧️ Key Insight</h3>
                <div style={{ background: '#1a1816', border: '1px solid #769656', borderRadius: '6px', padding: '1rem', borderLeft: '4px solid #769656' }}>
                  <p><strong>Consider:</strong> "If it is not raining, then the ground is wet."</p>
                  <p>Many think this should be False because "no rain" doesn't cause wetness. But in formal logic, we <em>cannot</em> declare this False! The ground's wetness exists independently (sprinklers, dew, etc.).</p>
                  <p style={{ fontWeight: 'bold', color: '#769656' }}>Key Point: When the "If" condition is False, the statement cannot be proven wrong, so it defaults to True.</p>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#769656', marginBottom: '1rem' }}>📊 IF-THEN Truth Table</h3>
                <div style={{ background: '#262421', border: '1px solid #3d3a37', borderRadius: '6px', padding: '1rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  <div style={{ color: '#769656', fontWeight: 'bold', marginBottom: '0.5rem' }}>Truth Table for "If X, then Y":</div>
                  <div>X = True,  Y = True  → Statement = True</div>
                  <div>X = True,  Y = False → Statement = False</div>
                  <div style={{ fontWeight: 'bold' }}>X = False, Y = True  → Statement = True ← KEY!</div>
                  <div style={{ fontWeight: 'bold' }}>X = False, Y = False → Statement = True ← KEY!</div>
                </div>
              </div>

              <div>
                <h3 style={{ color: '#769656', marginBottom: '1rem' }}>💡 Hard Mode Tips</h3>
                <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                  <li style={{ marginBottom: '0.5rem' }}>"If [False thing], then [anything]" = Always True</li>
                  <li style={{ marginBottom: '0.5rem' }}>IF-THEN is only False when: True condition → False result</li>
                  <li style={{ marginBottom: '0.5rem' }}>Check who's speaking: Truth-teller or Liar?</li>
                  <li>Match the statement result with the speaker's nature</li>
                </ul>
              </div>
            </>
          )
        };
      case 'masterHard':
        return {
          title: 'Master Hard Mode Instructions 🔥',
          content: (
            <>
              <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#ff6b35', borderRadius: '6px', border: '2px solid #ff8c42', color: '#ffffff' }}>
                <p style={{ fontWeight: '700', marginBottom: '0.5rem', fontSize: '1.1rem' }}>🔒 MASTER MODE WARNING</p>
                <p style={{ margin: '0' }}>Once you assign True/False to a player, you CANNOT change it! No takebacks, no second chances. Think carefully before each selection.</p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#769656', marginBottom: '1rem' }}>⚡ IF-THEN Logic (Permanent Mode)</h3>
                <p>Master Hard Mode uses IF/THEN conditional logic with <strong>permanent selections</strong>. You must navigate complex logical dependencies without any safety net.</p>
                
                <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#1a1816', borderRadius: '6px', border: '1px solid #3d3a37' }}>
                  <strong>Example:</strong><br/>
                  A says: "If B is a truth-teller, then C is a liar"<br/>
                  B says: "If A is a liar, then C is a truth-teller"
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#769656', marginBottom: '1rem' }}>🧠 Master Strategy</h3>
                <p><strong>Trace through conditional logic chains mentally.</strong> One wrong choice can make the entire puzzle unsolvable.</p>
                <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                  <li style={{ marginBottom: '0.5rem' }}>Remember: "If False, then anything" = Always True</li>
                  <li style={{ marginBottom: '0.5rem' }}>Work through all conditional implications before selecting</li>
                  <li>Consider how each choice affects other conditional statements</li>
                </ul>
              </div>

              <p style={{ fontWeight: 'bold', color: '#ff8c42' }}>Master Hard tests working memory limits - can you hold complex logical relationships in mind while making irreversible decisions?</p>
            </>
          )
        };
      case 'extreme':
        return {
          title: 'Extreme Mode Instructions',
          content: (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#769656', marginBottom: '1rem' }}>🚀 Advanced Logic Structures</h3>
                <p>Extreme mode features the most complex logical structures: nested conditions, group statements, and "if and only if" (IFF) statements.</p>
                
                <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#1a1816', borderRadius: '6px', border: '1px solid #3d3a37' }}>
                  <strong>Example Extreme Mode Puzzle:</strong><br/>
                  A says: "If B is a truth-teller, then either C is a liar or D is a truth-teller"<br/>
                  B says: "Exactly 2 of C, D, and E are truth-tellers"<br/>
                  C says: "A is a truth-teller if and only if E is a liar"
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#769656', marginBottom: '1rem' }}>🎯 Group Statements</h3>
                <p>Group statements specify exact counts: "Exactly X of players are truth-tellers"</p>
                
                <div style={{ background: '#1a1816', border: '1px solid #769656', borderRadius: '6px', padding: '1rem', borderLeft: '4px solid #769656' }}>
                  <strong>Example:</strong> "Exactly 2 of A, B, and C are truth-tellers"<br/>
                  <strong>Possible combinations:</strong><br/>
                  • A=T, B=T, C=F<br/>
                  • A=T, B=F, C=T<br/>
                  • A=F, B=T, C=T<br/>
                  <br/>
                  <strong>Invalid:</strong> A=T, B=T, C=T (too many) or A=F, B=F, C=F (too few)
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#769656', marginBottom: '1rem' }}>🔄 If and Only If (IFF)</h3>
                <p>IFF means both conditions must have the same truth value.</p>
                
                <div style={{ background: '#262421', border: '1px solid #3d3a37', borderRadius: '6px', padding: '1rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  <div style={{ color: '#769656', fontWeight: 'bold', marginBottom: '0.5rem' }}>IFF Truth Table:</div>
                  <div style={{ fontWeight: 'bold' }}>True IFF True = True</div>
                  <div>True IFF False = False</div>
                  <div>False IFF True = False</div>
                  <div style={{ fontWeight: 'bold' }}>False IFF False = True</div>
                </div>
              </div>

              <div>
                <h3 style={{ color: '#769656', marginBottom: '1rem' }}>⚡ Extreme Mode Strategy</h3>
                <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                  <li style={{ marginBottom: '0.5rem' }}>Start with group statements - they give concrete constraints</li>
                  <li style={{ marginBottom: '0.5rem' }}>Work systematically through each possibility</li>
                  <li style={{ marginBottom: '0.5rem' }}>For nested statements, work from the outside in</li>
                  <li>Use process of elimination - rule out impossible combinations</li>
                </ul>
              </div>
            </>
          )
        };
      case 'masterExtreme':
        return {
          title: 'Master Extreme Mode Instructions 👑',
          content: (
            <>
              <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#ff6b35', borderRadius: '6px', border: '2px solid #ff8c42', color: '#ffffff' }}>
                <p style={{ fontWeight: '700', marginBottom: '0.5rem', fontSize: '1.1rem' }}>🔒 MASTER MODE WARNING</p>
                <p style={{ margin: '0' }}>Once you assign True/False to a player, you CANNOT change it! No takebacks, no second chances. Think carefully before each selection.</p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#769656', marginBottom: '1rem' }}>🚀 Advanced Logic (Permanent Mode)</h3>
                <p>Master Extreme Mode uses the most advanced logical constructs (XOR, IFF, NESTED IFs, SELF-REFERENCE, GROUP constraints) with <strong>permanent selections</strong>. This is the ultimate test of logical mastery.</p>
                
                <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#1a1816', borderRadius: '6px', border: '1px solid #3d3a37' }}>
                  <strong>Example:</strong><br/>
                  A says: "Exactly one of B or C is a truth-teller XOR D is a liar"<br/>
                  B says: "I am a liar"<br/>
                  C says: "A is a truth-teller if and only if D is a truth-teller"
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#769656', marginBottom: '1rem' }}>🧠 Master Strategy</h3>
                <p><strong>These puzzles require sophisticated logical reasoning.</strong> Map out all constraints and dependencies before making any irreversible choices.</p>
                <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                  <li style={{ marginBottom: '0.5rem' }}>Understand XOR, IFF, and group logic before starting</li>
                  <li style={{ marginBottom: '0.5rem' }}>Handle self-reference statements carefully</li>
                  <li style={{ marginBottom: '0.5rem' }}>Use systematic elimination of impossible combinations</li>
                  <li>Consider using pencil and paper for complex puzzles</li>
                </ul>
              </div>

              <p style={{ fontWeight: 'bold', color: '#ff8c42' }}>Master Extreme is legendary difficulty - only true logic masters can solve these without trial-and-error!</p>
            </>
          )
        };
      default:
        return { title: 'Instructions', content: <p>Unknown mode</p> };
    }
  };

  const instructions = getInstructions();

  // Modal styles matching the Chess.com theme
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '2rem'
  };

  const modalStyle = {
    background: '#262421',
    borderRadius: '12px',
    padding: '3rem',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    border: '1px solid #3d3a37',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
  };

  const titleStyle = {
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '2rem',
    color: '#ffffff',
    fontFamily: 'Georgia, serif',
    textAlign: 'center'
  };

  const contentStyle = {
    fontSize: '1rem',
    lineHeight: '1.6',
    color: '#e5e0dc',
    marginBottom: '2rem'
  };

  const checkboxContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '2rem',
    padding: '1rem',
    background: '#1a1816',
    borderRadius: '6px',
    border: '1px solid #3d3a37'
  };

  const checkboxStyle = {
    width: '18px',
    height: '18px',
    accentColor: '#769656'
  };

  const buttonContainerStyle = {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end'
  };

  const buttonStyle = {
    background: '#769656',
    color: '#ffffff',
    padding: '0.875rem 2rem',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '1rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div style={modalStyle}>
        <h2 style={titleStyle}>{instructions.title}</h2>
        <div style={contentStyle}>
          {instructions.content}
        </div>
        
        {!isManualOpen && (
          <div style={checkboxContainerStyle}>
            <input
              type="checkbox"
              id="skipInstructions"
              checked={skipInFuture}
              onChange={(e) => setSkipInFuture(e.target.checked)}
              style={checkboxStyle}
            />
            <label htmlFor="skipInstructions" style={{ cursor: 'pointer', color: '#b0a99f' }}>
              Don't show instructions for this mode again
            </label>
          </div>
        )}

        <div style={buttonContainerStyle}>
          <button 
            style={buttonStyle}
            onClick={handleClose}
            onMouseEnter={(e) => {
              e.target.style.background = '#5d7c3f';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#769656';
            }}
          >
            Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
} 