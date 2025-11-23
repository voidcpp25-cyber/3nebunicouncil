import { useState } from 'react';
import { importJokesFromText } from '../utils/importJokes';
import { FaDownload } from 'react-icons/fa';

export default function ImportJokes() {
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<{ joke: string; success: boolean; id?: string; error?: string }>>([]);

  const handleImport = async () => {
    if (!fileContent.trim()) {
      alert('Please paste the content of the jokes file.');
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const importResults = await importJokesFromText(fileContent);
      setResults(importResults);
      
      const successCount = importResults.filter(r => r.success).length;
      const failCount = importResults.filter(r => !r.success).length;
      
      alert(`Import complete!\nSuccess: ${successCount}\nFailed: ${failCount}`);
    } catch (error) {
      console.error('Error importing jokes:', error);
      alert('Error importing jokes. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="import-jokes">
      <h2>Import Jokes from Text File</h2>
      <p>
        Paste the content of "The Official Inside Joke List.txt" file below and click Import.
      </p>

      <textarea
        value={fileContent}
        onChange={(e) => setFileContent(e.target.value)}
        placeholder="Paste the content of the jokes file here..."
        rows={15}
      />

      <button
        onClick={handleImport}
        disabled={loading || !fileContent.trim()}
      >
        {loading ? 'Importing...' : <><FaDownload /> Import Jokes</>}
      </button>

      {results.length > 0 && (
        <div>
          <h3>Import Results</h3>
          <div>
            {results.map((result, index) => (
              <div
                key={index}
                style={{
                  padding: '8px',
                  marginBottom: '5px',
                  background: result.success ? '#1a2e1a' : '#2e1a1a',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  border: `1px solid ${result.success ? '#2a4a2a' : '#4a2a2a'}`,
                }}
              >
                {result.success ? (
                  <span style={{ color: '#4ade80' }}>✓ {result.joke}</span>
                ) : (
                  <span style={{ color: '#f87171' }}>
                    ✗ {result.joke} - Error: {result.error}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

