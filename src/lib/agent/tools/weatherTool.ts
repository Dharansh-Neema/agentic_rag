import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY, OPENWEATHER_API_KEY } from '../../utils/env';

// OpenWeatherMap API key should be added to your .env file
// Add OPENWEATHER_API_KEY=your_api_key_here to your .env file

/**
 * Extract location from a weather query
 * @param query The user's weather query
 * @returns The extracted location
 */
async function extractLocationFromQuery(query: string): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      Extract the location name from the following weather-related query.
      Return ONLY the location name, nothing else.
      If no specific location is mentioned, return "current location".
      
      Query: "${query}"
      Location:
    `;

    const result = await model.generateContent(prompt);
    const location = result.response.text().trim();
    return location === 'current location' ? 'Delhi' : location; // Default to Delhi if no location specified
  } catch (error) {
    console.error('Error extracting location:', error);
    return 'Delhi'; // Default to Delhi on error
  }
}

/**
 * Get weather data from OpenWeatherMap API
 * @param location The location to get weather for
 * @returns Weather data object or null if error
 */
async function getWeatherData(location: string): Promise<any> {
  try {
    if (!OPENWEATHER_API_KEY) {
      throw new Error('OpenWeatherMap API key not configured');
    }
    
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Weather API returned ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

/**
 * Format weather data into a human-readable response
 * @param weatherData The weather data from OpenWeatherMap
 * @param location The location requested
 * @returns Formatted weather response
 */
async function formatWeatherResponse(weatherData: any, location: string): Promise<string> {
  if (!weatherData) {
    // Fall back to Gemini for a generic response if we can't get real weather data
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `
      Generate a response explaining that you don't have access to real-time weather data for ${location}.
      Suggest alternative ways for the user to check the weather.
      Be concise but helpful.
    `;
    
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
  
  // Format the real weather data into a nice response
  const temp = Math.round(weatherData.main.temp);
  const feelsLike = Math.round(weatherData.main.feels_like);
  const description = weatherData.weather[0].description;
  const humidity = weatherData.main.humidity;
  const windSpeed = weatherData.wind.speed;
  
  return `
    Current weather in ${weatherData.name}:
    • Temperature: ${temp}°C (feels like ${feelsLike}°C)
    • Conditions: ${description}
    • Humidity: ${humidity}%
    • Wind: ${windSpeed} m/s
    
    This data was retrieved from OpenWeatherMap just now.
  `;
}

/**
 * Tool for handling weather-related queries
 * @param query The user's weather query
 * @returns Response to the weather query
 */
export async function handleWeatherQuery(query: string): Promise<string> {
  try {
    // Step 1: Extract location from query
    const location = await extractLocationFromQuery(query);
    console.log(`Extracted location: ${location}`);
    
    // Step 2: Get weather data for the location
    const weatherData = await getWeatherData(location);
    
    // Step 3: Format the response
    return await formatWeatherResponse(weatherData, location);
  } catch (error) {
    console.error('Error handling weather query:', error);
    return 'I apologize, but I encountered an error while processing your weather query. Please try again later.';
  }
}
