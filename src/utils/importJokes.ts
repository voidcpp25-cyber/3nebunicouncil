import { supabase } from '../lib/supabase';
import { parseJokesFromText } from './parseJokes';

// Utility function to import jokes from the text file
export async function importJokesFromText(text: string) {
  const jokes = parseJokesFromText(text);
  const results = [];

  for (const jokeText of jokes) {
    try {
      const { data, error } = await supabase
        .from('jokes')
        .insert({
          text: jokeText,
          is_official: true,
        })
        .select();

      if (error) {
        console.error(`Error importing joke "${jokeText}":`, error);
        results.push({ joke: jokeText, success: false, error: error.message });
      } else {
        results.push({ joke: jokeText, success: true, id: data?.[0]?.id });
      }
    } catch (error) {
      console.error(`Error importing joke "${jokeText}":`, error);
      results.push({ joke: jokeText, success: false, error: String(error) });
    }
  }

  return results;
}

// You can call this function from the browser console or create an admin page
// Example usage:
// import { importJokesFromText } from './utils/importJokes';
// const fileContent = await fetch('/path/to/file.txt').then(r => r.text());
// const results = await importJokesFromText(fileContent);
// console.log(results);

