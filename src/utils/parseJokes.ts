// Utility to parse jokes from the text file
export function parseJokesFromText(text: string): string[] {
  const lines = text.split('\n');
  const jokes: string[] = [];
  let currentJoke: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // If line starts with "-", it's a new joke
    if (trimmed.startsWith('-')) {
      // Save previous joke if it exists
      if (currentJoke.length > 0) {
        const jokeText = currentJoke.join(' ').trim();
        if (jokeText.length > 0) {
          jokes.push(jokeText);
        }
      }
      
      // Start new joke
      let joke = trimmed.substring(1).trim();
      // Remove trailing backslashes
      joke = joke.replace(/\\+$/, '');
      // Remove any remaining escape characters
      joke = joke.replace(/\\/g, '');
      currentJoke = joke.length > 0 ? [joke] : [];
    } else if (trimmed.length > 0 && currentJoke.length > 0) {
      // Continuation of current joke (line doesn't start with "-" but has content)
      let continuation = trimmed;
      // Remove trailing backslashes
      continuation = continuation.replace(/\\+$/, '');
      // Remove any remaining escape characters
      continuation = continuation.replace(/\\/g, '');
      if (continuation.length > 0) {
        currentJoke.push(continuation);
      }
    }
  }
  
  // Don't forget the last joke
  if (currentJoke.length > 0) {
    const jokeText = currentJoke.join(' ').trim();
    if (jokeText.length > 0) {
      jokes.push(jokeText);
    }
  }
  
  return jokes;
}

