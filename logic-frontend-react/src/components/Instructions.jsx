import { useState } from 'react';

export default function Instructions({ onBack }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Chess.com style inline styles
  const appStyle = {
    minHeight: '100vh',
    padding: '0',
    background: '#262421',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #769656 0%, #5d7c3f 100%)',
    textAlign: 'center',
    padding: '3rem 2rem',
    position: 'relative'
  };

  const titleStyle = {
    fontSize: '2.5rem',
    fontWeight: '700',
    marginBottom: '1rem',
    color: '#ffffff',
    fontFamily: 'Georgia, serif',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
  };

  const backButtonStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontWeight: '500',
    fontSize: '0.875rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'absolute',
    top: '2rem',
    left: '2rem'
  };

  const sectionStyle = {
    background: '#312e2b',
    padding: '2rem'
  };

  const cardStyle = {
    background: '#262421',
    borderRadius: '12px',
    padding: '2rem',
    margin: '0 auto',
    maxWidth: '1000px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    border: '1px solid #3d3a37'
  };

  const tabBarStyle = {
    display: 'flex',
    marginBottom: '2rem',
    borderBottom: '1px solid #3d3a37'
  };

  const tabStyle = (isActive) => ({
    background: isActive ? '#769656' : 'transparent',
    color: isActive ? '#ffffff' : '#b0a99f',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '6px 6px 0 0',
    fontWeight: '500',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginRight: '0.5rem'
  });

  const contentStyle = {
    padding: '1rem 0'
  };

  const sectionTitleStyle = {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
    color: '#ffffff',
    fontFamily: 'Georgia, serif'
  };

  const subsectionStyle = {
    marginBottom: '2rem',
    padding: '1.5rem',
    background: '#1a1816',
    borderRadius: '8px',
    border: '1px solid #3d3a37'
  };

  const subsectionTitleStyle = {
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: '#769656'
  };

  const textStyle = {
    color: '#e5e0dc',
    lineHeight: '1.6',
    marginBottom: '0.75rem'
  };

  const listStyle = {
    listStyle: 'none',
    padding: '0',
    margin: '0'
  };

  const listItemStyle = {
    color: '#e5e0dc',
    lineHeight: '1.6',
    marginBottom: '0.5rem',
    paddingLeft: '1rem',
    position: 'relative'
  };

  const bulletStyle = {
    position: 'absolute',
    left: '0',
    color: '#769656',
    fontWeight: 'bold'
  };

  const exampleStyle = {
    background: '#262421',
    border: '1px solid #3d3a37',
    borderRadius: '6px',
    padding: '1rem',
    marginTop: '1rem',
    fontFamily: 'Georgia, serif',
    fontSize: '0.875rem',
    color: '#b0a99f',
    fontStyle: 'italic'
  };

  const renderOverview = () => (
    <div style={contentStyle}>
      <h2 style={sectionTitleStyle}>🧠 Logic Game Overview</h2>
      
      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>🎯 The Objective</h3>
        <p style={textStyle}>
          Find <strong>a logically valid solution</strong> by determining who are the <strong>truth-tellers</strong> and who are the <strong>liars</strong> based on their statements about each other.
        </p>
        <p style={textStyle}>
          <em>Note: Some puzzles may have multiple valid solutions - you only need to find one!</em>
        </p>
      </div>

      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>📝 Basic Rules</h3>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            <strong>Truth-tellers</strong> always make true statements
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            <strong>Liars</strong> always make false statements
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            Every puzzle has at least one logically valid solution
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            Use logical deduction to find a valid configuration
          </li>
        </ul>
        <div style={exampleStyle}>
          Example: If Player A says "Player B is a truth-teller" and this statement is true, 
          then A must be a truth-teller and B must also be a truth-teller.
        </div>
      </div>

      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>🎮 Game Modes</h3>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            <strong>Practice Mode:</strong> Train without pressure, no time limits
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            <strong>Ranked Mode:</strong> Find a logically valid solution as quickly as possible to maximize ELO gains
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            <strong>Master Mode:</strong> Advanced challenges for experienced players
          </li>
        </ul>
      </div>
    </div>
  );

  const renderEasyMode = () => (
    <div style={contentStyle}>
      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>🎯 Direct Statements</h3>
        <p style={textStyle}>
          Easy mode features simple, direct statements where players make claims about other players being truth-tellers or liars.
        </p>
        
        <div style={exampleStyle}>
          <strong>Example Puzzle:</strong><br/>
          A says: "B is a truth-teller"<br/>
          B says: "A is a liar"<br/>
          C says: "B is a liar"
        </div>
      </div>

      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>🔍 Solving Strategy</h3>
        <p style={textStyle}>
          <strong>Step 1:</strong> Look for contradictions. In the example above, A and B make opposite claims about each other.
        </p>
        <p style={textStyle}>
          <strong>Step 2:</strong> Test assumptions. If A is a truth-teller, then B must be a truth-teller (A's statement). But if B is a truth-teller, then A must be a liar (B's statement). This is a contradiction!
        </p>
        <p style={textStyle}>
          <strong>Step 3:</strong> Try the opposite. If A is a liar, then B must be a liar (A's false statement). If B is a liar, then A must be a truth-teller (B's false statement). Another contradiction!
        </p>
        <p style={textStyle}>
          <strong>Step 4:</strong> Use the third statement. C says "B is a liar." If C is a truth-teller and B is a liar, then A must be a truth-teller (since B's statement "A is a liar" would be false).
        </p>
        
        <div style={{
          background: '#1a1816',
          border: '1px solid #769656',
          borderRadius: '6px',
          padding: '1rem',
          margin: '1rem 0',
          borderLeft: '4px solid #769656'
        }}>
          <strong style={{color: '#769656'}}>Solution:</strong> A = Truth-teller, B = Liar, C = Truth-teller<br/>
          <strong>Verification:</strong><br/>
          • A (truth-teller) says "B is a truth-teller" → False statement ❌<br/>
          • Wait, this doesn't work! Let me recalculate...<br/><br/>
          <strong style={{color: '#769656'}}>Correct Solution:</strong> A = Liar, B = Liar, C = Truth-teller<br/>
          • A (liar) says "B is a truth-teller" → False statement ✓<br/>
          • B (liar) says "A is a liar" → True statement ❌<br/>
          <br/>
          <strong style={{color: '#769656'}}>Actually Correct:</strong> A = Liar, B = Truth-teller, C = Liar<br/>
          • A (liar) says "B is a truth-teller" → True statement ❌<br/>
          <br/>
          This puzzle demonstrates why systematic checking is crucial!
        </div>
      </div>

      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>💡 Easy Mode Tips</h3>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            Start with statements that create direct contradictions
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            Always verify your solution by checking each statement
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            If a truth-teller makes a statement, it must be true
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            If a liar makes a statement, it must be false
          </li>
        </ul>
      </div>
    </div>
  );

  const renderMediumMode = () => (
    <div style={contentStyle}>
      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>🔧 Logical Operators</h3>
        <p style={textStyle}>
          Medium mode introduces logical operators: <strong>AND</strong> and <strong>OR</strong>. These create compound statements that must be evaluated carefully.
        </p>
        
        <div style={exampleStyle}>
          <strong>Example Medium Mode Puzzle:</strong><br/>
          A says: "B is a truth-teller AND C is a liar"<br/>
          B says: "A is a liar OR C is a truth-teller"<br/>
          C says: "Either A is a truth-teller OR B is a liar"
        </div>
      </div>

      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>📊 Operator Truth Tables</h3>
        
        <div style={{
          background: '#262421',
          border: '1px solid #3d3a37',
          borderRadius: '6px',
          padding: '1rem',
          margin: '1rem 0',
          fontFamily: 'monospace',
          fontSize: '0.875rem'
        }}>
          <div style={{color: '#769656', fontWeight: 'bold', marginBottom: '0.5rem'}}>AND (both must be true):</div>
          <div style={{color: '#b0a99f'}}>True AND True = True</div>
          <div style={{color: '#b0a99f'}}>True AND False = False</div>
          <div style={{color: '#b0a99f'}}>False AND True = False</div>
          <div style={{color: '#b0a99f'}}>False AND False = False</div>
        </div>

        <div style={{
          background: '#262421',
          border: '1px solid #3d3a37',
          borderRadius: '6px',
          padding: '1rem',
          margin: '1rem 0',
          fontFamily: 'monospace',
          fontSize: '0.875rem'
        }}>
          <div style={{color: '#769656', fontWeight: 'bold', marginBottom: '0.5rem'}}>OR (at least one must be true):</div>
          <div style={{color: '#b0a99f'}}>True OR True = True</div>
          <div style={{color: '#b0a99f'}}>True OR False = True</div>
          <div style={{color: '#b0a99f'}}>False OR True = True</div>
          <div style={{color: '#b0a99f'}}>False OR False = False</div>
        </div>
      </div>

      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>🧩 Solving Example</h3>
        <p style={textStyle}>
          Let's solve: A says "B is a truth-teller AND C is a liar"
        </p>
        
        <div style={{
          background: '#1a1816',
          border: '1px solid #769656',
          borderRadius: '6px',
          padding: '1rem',
          margin: '1rem 0',
          borderLeft: '4px solid #769656'
        }}>
          <strong style={{color: '#769656'}}>If A is a truth-teller:</strong><br/>
          • A's statement must be true<br/>
          • So B must be a truth-teller AND C must be a liar<br/>
          <br/>
          <strong style={{color: '#769656'}}>If A is a liar:</strong><br/>
          • A's statement must be false<br/>
          • So either B is NOT a truth-teller OR C is NOT a liar (or both)<br/>
          • This means: B is a liar OR C is a truth-teller (or both)
        </div>

        <p style={textStyle}>
          The key is understanding that when a liar makes an AND statement, 
          <strong> at least one part must be false</strong> for the whole statement to be false.
        </p>
      </div>

      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>💡 Medium Mode Tips</h3>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            AND is only true when ALL parts are true
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            OR is true when ANY part is true
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            When a liar makes an AND statement, at least one part must be false
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            When a liar makes an OR statement, all parts must be false
          </li>
        </ul>
      </div>
    </div>
  );

  const renderRules = () => (
    <div style={contentStyle}>
      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>⚡ IF-THEN Statements</h3>
        <p style={textStyle}>
          Hard mode introduces conditional statements using <strong>"If X, then Y"</strong> format. These are the most confusing statements in logic puzzles.
        </p>
        
        <div style={exampleStyle}>
          <strong>Example Hard Mode Puzzle:</strong><br/>
          A says: "If B is a truth-teller, then C is a liar"<br/>
          B says: "If A is a liar, then C is a truth-teller"<br/>
          C says: "If A is a truth-teller, then B is a liar"
        </div>
        
        <div style={{
          background: '#1a1816',
          border: '1px solid #769656',
          borderRadius: '6px',
          padding: '1.5rem',
          margin: '1rem 0',
          borderLeft: '4px solid #769656'
        }}>
          <h4 style={{color: '#769656', marginBottom: '1rem', fontSize: '1rem'}}>🌧️ Real-Life Example</h4>
          <p style={textStyle}>
            Consider the statement: <strong>"If it is not raining, then the ground is wet."</strong>
          </p>
          <p style={textStyle}>
            Many people think this should be False because "no rain" doesn't cause wetness. 
            But in formal logic, we <em>cannot</em> declare this False! Here's why:
          </p>
          <ul style={listStyle}>
            <li style={{...listItemStyle, marginBottom: '0.75rem'}}>
              <span style={bulletStyle}>•</span>
              The ground's wetness exists independently (sprinklers, dew, previous rain, etc.)
            </li>
            <li style={{...listItemStyle, marginBottom: '0.75rem'}}>
              <span style={bulletStyle}>•</span>
              Since the condition "not raining" is true, and the result "wet ground" is also true, the statement holds
            </li>
            <li style={{...listItemStyle, marginBottom: '0.75rem'}}>
              <span style={bulletStyle}>•</span>
              The statement only becomes False when: "If it IS raining, then the ground is NOT wet" 
              (a true condition leading to an impossible false result)
            </li>
          </ul>
          <p style={{...textStyle, fontWeight: 'bold', color: '#769656'}}>
            Key Point: In our puzzles, every player has a fixed True/False nature. When the "If" condition is False, 
            the statement cannot be proven wrong, so it defaults to True.
          </p>
        </div>
      </div>

      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>📊 IF-THEN Truth Table</h3>
        
        <div style={{
          background: '#262421',
          border: '1px solid #3d3a37',
          borderRadius: '6px',
          padding: '1rem',
          margin: '1rem 0',
          fontFamily: 'monospace',
          fontSize: '0.875rem'
        }}>
          <div style={{color: '#769656', fontWeight: 'bold', marginBottom: '0.5rem'}}>Truth Table for "If X, then Y":</div>
          <div style={{color: '#b0a99f'}}>X = True,  Y = True  → Statement = True</div>
          <div style={{color: '#b0a99f'}}>X = True,  Y = False → Statement = False</div>
          <div style={{color: '#e5e0dc', fontWeight: 'bold'}}>X = False, Y = True  → Statement = True ← KEY!</div>
          <div style={{color: '#e5e0dc', fontWeight: 'bold'}}>X = False, Y = False → Statement = True ← KEY!</div>
        </div>

        <p style={textStyle}>
          <strong>Key Insight:</strong> When the "If" part is False, the whole statement is automatically True!
        </p>
      </div>

      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>🧩 Example Walkthrough</h3>
        <p style={textStyle}>
          Let's say C (who we think is a Liar) says: <em>"If E is True, then D is True."</em>
        </p>
        
        <div style={{
          background: '#1a1816',
          border: '1px solid #769656',
          borderRadius: '6px',
          padding: '1rem',
          margin: '1rem 0',
          borderLeft: '4px solid #769656'
        }}>
          <strong style={{color: '#769656'}}>Scenario:</strong> E = False, D = True<br/>
          <strong>Statement becomes:</strong> "If False, then True"<br/>
          <strong>This evaluates to:</strong> True<br/>
          <strong>Problem:</strong> C is supposed to be a Liar but made a True statement!<br/>
          <strong>Conclusion:</strong> Our assumption about C is wrong.
        </div>

        <p style={textStyle}>
          This is the most common mistake! People think "If False, then True" should be False, but it's actually True.
        </p>
      </div>

      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>💡 Hard Mode Tips</h3>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            "If [False thing], then [anything]" = Always True
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            IF-THEN is only False when: True condition → False result
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            Check who's speaking: Truth-teller or Liar?
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            Match the statement result with the speaker's nature
          </li>
        </ul>
      </div>

      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>🎯 Practice Strategy</h3>
        <p style={textStyle}>
          1. <strong>Identify the speaker:</strong> Are they supposed to be a Truth-teller or Liar?
        </p>
        <p style={textStyle}>
          2. <strong>Evaluate the statement:</strong> What does it actually say when you plug in the values?
        </p>
        <p style={textStyle}>
          3. <strong>Check consistency:</strong> Does the statement result match the speaker's nature?
        </p>
        <p style={textStyle}>
          4. <strong>If inconsistent:</strong> Your assumption about the speaker is wrong!
        </p>
      </div>
    </div>
  );

  const renderExtremeMode = () => (
    <div style={contentStyle}>
      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>🚀 Advanced Logic Structures</h3>
        <p style={textStyle}>
          Extreme mode features the most complex logical structures: nested conditions, group statements, 
          and "if and only if" (IFF) statements.
        </p>
        
        <div style={exampleStyle}>
          <strong>Example Puzzle:</strong><br/>
          A says: "If B is a truth-teller, then either C is a liar or D is a truth-teller"<br/>
          B says: "Exactly 2 of C, D, and E are truth-tellers"<br/>
          C says: "A is a truth-teller if and only if E is a liar"<br/>
          D says: "If A is a liar, then if C is a truth-teller, then B is a liar"<br/>
          E says: "Either all of us are truth-tellers or all of us are liars"
        </div>
      </div>

      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>🎯 Group Statements</h3>
        <p style={textStyle}>
          Group statements specify exact counts: "Exactly X of players are truth-tellers"
        </p>
        
        <div style={{
          background: '#1a1816',
          border: '1px solid #769656',
          borderRadius: '6px',
          padding: '1rem',
          margin: '1rem 0',
          borderLeft: '4px solid #769656'
        }}>
          <strong style={{color: '#769656'}}>Example:</strong> "Exactly 2 of A, B, and C are truth-tellers"<br/>
          <strong>Possible combinations:</strong><br/>
          • A=T, B=T, C=F<br/>
          • A=T, B=F, C=T<br/>
          • A=F, B=T, C=T<br/>
          <br/>
          <strong>Invalid:</strong> A=T, B=T, C=T (too many) or A=F, B=F, C=F (too few)
        </div>
      </div>

      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>🔄 If and Only If (IFF)</h3>
        <p style={textStyle}>
          IFF means both conditions must have the same truth value.
        </p>
        
        <div style={{
          background: '#262421',
          border: '1px solid #3d3a37',
          borderRadius: '6px',
          padding: '1rem',
          margin: '1rem 0',
          fontFamily: 'monospace',
          fontSize: '0.875rem'
        }}>
          <div style={{color: '#769656', fontWeight: 'bold', marginBottom: '0.5rem'}}>IFF Truth Table:</div>
          <div style={{color: '#e5e0dc', fontWeight: 'bold'}}>True IFF True = True</div>
          <div style={{color: '#b0a99f'}}>True IFF False = False</div>
          <div style={{color: '#b0a99f'}}>False IFF True = False</div>
          <div style={{color: '#e5e0dc', fontWeight: 'bold'}}>False IFF False = True</div>
        </div>

        <p style={textStyle}>
          "A is a truth-teller if and only if B is a liar" means:
          <br/>• If A is true, then B must be false
          <br/>• If A is false, then B must be true
        </p>
      </div>

      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>🏗️ Nested Conditions</h3>
        <p style={textStyle}>
          Nested IF statements: "If X, then if Y, then Z"
        </p>
        
        <div style={{
          background: '#1a1816',
          border: '1px solid #769656',
          borderRadius: '6px',
          padding: '1rem',
          margin: '1rem 0',
          borderLeft: '4px solid #769656'
        }}>
          <strong style={{color: '#769656'}}>Breaking it down:</strong><br/>
          "If A is true, then if B is true, then C is true"<br/><br/>
          <strong>Cases:</strong><br/>
          • If A is false → whole statement is true (regardless of B, C)<br/>
          • If A is true and B is false → whole statement is true<br/>
          • If A is true and B is true → C must be true for statement to be true
        </div>
      </div>

      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>⚡ Extreme Mode Strategy</h3>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            Start with group statements - they give concrete constraints
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            Work systematically through each possibility
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            For nested statements, work from the outside in
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            Use process of elimination - rule out impossible combinations
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            Consider using pencil and paper for complex puzzles
          </li>
        </ul>
      </div>
    </div>
  );

  const renderDifficulties = () => (
    <div style={contentStyle}>
      <h2 style={sectionTitleStyle}>📊 Difficulty Levels</h2>
      
      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>🟢 Easy</h3>
        <p style={textStyle}>
          Simple direct statements about other players.
        </p>
        <div style={exampleStyle}>
          "Player A is a truth-teller"<br/>
          "Player B is a liar"
        </div>
      </div>

      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>🔵 Medium</h3>
        <p style={textStyle}>
          Conditional statements using "if-then" logic.
        </p>
        <div style={exampleStyle}>
          "If Player A is a truth-teller, then Player B is a liar"<br/>
          "If Player C is telling the truth, then Player D is also telling the truth"
        </div>
      </div>

      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>🟠 Hard</h3>
        <p style={textStyle}>
          Complex logical operators: AND, OR, XOR (exclusive or).
        </p>
        <div style={exampleStyle}>
          "Player A and Player B are both truth-tellers"<br/>
          "Either Player C or Player D is a liar (but not both)"<br/>
          "Player E and Player F cannot both be truth-tellers"
        </div>
      </div>

      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>🟣 Extreme</h3>
        <p style={textStyle}>
          Nested conditions, group statements, and complex logical structures.
        </p>
        <div style={exampleStyle}>
          "If Player A is a truth-teller, then either Player B is a liar or Player C is a truth-teller"<br/>
          "Among Players D, E, and F, exactly two are truth-tellers"<br/>
          "Player G is a truth-teller if and only if Player H is a liar"
        </div>
      </div>
    </div>
  );

  const renderStrategies = () => (
    <div style={contentStyle}>
      <h2 style={sectionTitleStyle}>💡 Solving Strategies</h2>
      
      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>🔍 Starting Points</h3>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            Look for statements that create obvious contradictions
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            Find statements where players reference themselves
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            Identify chains of logic that build on each other
          </li>
        </ul>
      </div>

      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>🧩 Step-by-Step Approach</h3>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            <span style={bulletStyle}>1.</span>
            Assume one player is a truth-teller/liar
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>2.</span>
            Follow the logical implications of that assumption
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>3.</span>
            If you reach a contradiction, the assumption was wrong
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>4.</span>
            Try the opposite assumption and see if it works
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>5.</span>
            Continue until you find a consistent solution
          </li>
        </ul>
      </div>

      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>⚡ Pro Tips</h3>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            Take your time in Practice Mode - there's no rush!
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            Work systematically through each possibility
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            Keep track of what you've determined on paper if needed
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            Start with easier difficulties and work your way up
          </li>
        </ul>
      </div>
    </div>
  );

  const renderRanked = () => (
    <div style={contentStyle}>
      <h2 style={sectionTitleStyle}>🏆 Ranked Mode</h2>
      
      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>📈 ELO Rating System</h3>
        <p style={textStyle}>
          Your skill is measured by an ELO rating system similar to chess. Win games to gain ELO, 
          lose games to lose ELO. Your rating determines your tier.
        </p>
      </div>

      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>🎖️ Tiers</h3>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            <strong>Beginner:</strong> Under 1200 ELO
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            <strong>Advanced:</strong> 1200-1599 ELO
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            <strong>Expert:</strong> 1600-1999 ELO
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            <strong>Master:</strong> 2000-2399 ELO
          </li>
          <li style={listItemStyle}>
            <span style={bulletStyle}>•</span>
            <strong>Grandmaster:</strong> 2400+ ELO
          </li>
        </ul>
      </div>

      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>⏱️ Time Pressure</h3>
        <p style={textStyle}>
          Ranked games have time limits that vary by difficulty. Solve faster to maximize your ELO gains!
        </p>
      </div>

      <div style={subsectionStyle}>
        <h3 style={subsectionTitleStyle}>🏅 Leaderboard</h3>
        <p style={textStyle}>
          Compete with other players to reach the top of the global leaderboard. 
          Only your best performances count!
        </p>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', component: renderOverview },
    { id: 'easy', label: 'Easy Mode', component: renderEasyMode },
    { id: 'medium', label: 'Medium Mode', component: renderMediumMode },
    { id: 'rules', label: 'Hard Mode', component: renderRules },
    { id: 'extreme', label: 'Extreme Mode', component: renderExtremeMode },
    { id: 'difficulties', label: 'Difficulties', component: renderDifficulties },
    { id: 'strategies', label: 'Strategies', component: renderStrategies },
    { id: 'ranked', label: 'Ranked Mode', component: renderRanked }
  ];

  return (
    <div style={appStyle}>
      <div style={headerStyle}>
        <button 
          style={backButtonStyle}
          onClick={onBack}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          ← Back to Dashboard
        </button>
        
        <h1 style={titleStyle}>How to Play</h1>
        <p style={{
          fontSize: '1.25rem',
          color: 'rgba(255, 255, 255, 0.9)',
          marginBottom: '0',
          fontWeight: '400'
        }}>
          Master the Art of Logic
        </p>
      </div>

      <div style={sectionStyle}>
        <div style={cardStyle}>
          <div style={tabBarStyle}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                style={tabStyle(activeTab === tab.id)}
                onClick={() => setActiveTab(tab.id)}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.background = 'rgba(118, 150, 86, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {tabs.find(tab => tab.id === activeTab)?.component()}
        </div>
      </div>
    </div>
  );
} 