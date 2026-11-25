const fs = require('fs');
const https = require('https');

// Configuration
const API_KEY = '35564e1ceb3d4a359f4b2431f1fb8cf2';
const BASE_URL = 'https://api.rawg.io/api/games';
const INPUT_FILE = 'games_v3.json';
const OUTPUT_FILE = 'games_v3.json';

// Function to make HTTP request
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Function to fetch game description
async function fetchGameDescription(gameId) {
  const url = `${BASE_URL}/${gameId}?key=${API_KEY}`;
  
  try {
    console.log(`Fetching description for game ID: ${gameId}`);
    const response = await makeRequest(url);
    
    if (response.description) {
      // Clean up the description (remove HTML tags)
      const cleanDescription = response.description
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
        .replace(/&amp;/g, '&') // Replace &amp; with &
        .replace(/&lt;/g, '<') // Replace &lt; with <
        .replace(/&gt;/g, '>') // Replace &gt; with >
        .replace(/&quot;/g, '"') // Replace &quot; with "
        .trim();
      
      return cleanDescription;
    } else {
      console.warn(`No description found for game ID: ${gameId}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching description for game ID ${gameId}:`, error.message);
    return null;
  }
}

// Main function to process games
async function processGames() {
  try {
    // Read the input file
    console.log(`Reading ${INPUT_FILE}...`);
    const games = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
    
    console.log(`Processing ${games.length} games...`);
    
    // Process each game
    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      
      // Skip if description already exists
      if (game.description) {
        console.log(`Skipping ${game.name} - description already exists`);
        continue;
      }
      
      // Fetch description
      const description = await fetchGameDescription(game.id);
      
      if (description) {
        game.description = description;
        console.log(`✓ Added description for: ${game.name}`);
      } else {
        console.log(`✗ No description found for: ${game.name}`);
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Save the updated games
    console.log(`Saving updated games to ${OUTPUT_FILE}...`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(games, null, 2));
    
    console.log('✅ Processing complete!');
    console.log(`Updated ${games.length} games in ${OUTPUT_FILE}`);
    
  } catch (error) {
    console.error('Error processing games:', error.message);
    process.exit(1);
  }
}

// Function to process specific range of games from games_v2.json
async function processGamesFromV2(startIndex = 0, count = 10) {
  try {
    console.log(`Processing games ${startIndex} to ${startIndex + count - 1} from games_v2.json...`);
    
    // Read games_v2.json
    const allGames = JSON.parse(fs.readFileSync('games_v2.json', 'utf8'));
    
    // Get the specified range
    const gamesToProcess = allGames.slice(startIndex, startIndex + count);
    
    if (gamesToProcess.length === 0) {
      console.log('No games found in the specified range');
      return;
    }
    
    console.log(`Found ${gamesToProcess.length} games to process`);
    
    // Process each game
    for (let i = 0; i < gamesToProcess.length; i++) {
      const game = gamesToProcess[i];
      
      // Fetch description
      const description = await fetchGameDescription(game.id);
      
      if (description) {
        game.description = description;
        console.log(`✓ Added description for: ${game.name}`);
      } else {
        console.log(`✗ No description found for: ${game.name}`);
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Save to games_v3.json
    console.log(`Saving ${gamesToProcess.length} games to games_v3.json...`);
    fs.writeFileSync('games_v3.json', JSON.stringify(gamesToProcess, null, 2));
    
    console.log('✅ Processing complete!');
    console.log(`Updated games_v3.json with ${gamesToProcess.length} games`);
    
  } catch (error) {
    console.error('Error processing games from v2:', error.message);
    process.exit(1);
  }
}

// Command line interface
const args = process.argv.slice(2);

if (args.length === 0) {
  // Default: process games_v3.json
  processGames();
} else if (args[0] === 'from-v2') {
  // Process from games_v2.json
  const startIndex = parseInt(args[1]) || 0;
  const count = parseInt(args[2]) || 10;
  processGamesFromV2(startIndex, count);
} else {
  console.log('Usage:');
  console.log('  node description_script.js                    # Process games_v3.json');
  console.log('  node description_script.js from-v2 [start] [count]  # Process from games_v2.json');
  console.log('');
  console.log('Examples:');
  console.log('  node description_script.js                    # Process current games_v3.json');
  console.log('  node description_script.js from-v2 0 10       # Process first 10 games from games_v2.json');
  console.log('  node description_script.js from-v2 10 10      # Process next 10 games (11-20)');
  console.log('  node description_script.js from-v2 20 20      # Process next 20 games (21-40)');
}
