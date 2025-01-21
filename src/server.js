import express from 'express';
import cors from 'cors'; // Import the CORS package
import dotenv from 'dotenv'; 
import ModelClient from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';

dotenv.config({ path: './src/.env' });

const app = express();
const port = 3000;

// Use CORS middleware to allow requests from any origin (or specify the allowed origins)
app.use(cors()); // You can customize this by providing an options object, e.g., app.use(cors({ origin: 'http://your-frontend-domain.com' }));

// Middleware to parse JSON requests
app.use(express.json());

// Prompt function
const prompt = (text) => {
  return `This is the text: ${text}. I want a summary of the text as an arraylist back in the following form. Do not write any additional text, just give me the arraylist: I want you to extend and enhance this list with contents from the article. Here are the descriptions of the attributes: [entity name; entity description; status or group; references to one or more other entities created that resemble superordinate concepts or entities like a parent-child relationship or a whole-part relationship,where always the bigger or superordinate is represented; a list of tuples that consist of one reference to another created entity and a matching description where dynamics and relationships that are not hierarchical should be described for example the way one entity changes another one ]. Try to be detailled and create rather more than less entries. Here is an example so you have an idea, how the form could look like:
  "[
      {
          "name": "car",
          "description": "A wheeled motor vehicle used for transportation, typically powered by an internal combustion engine or an electric motor, designed to carry a small number of passengers.",
          "status": "transportation mode",
          "parents": ["transportation"],
          "relations": [
              ["engine", "Powered by either internal combustion engines or electric motors"],
              ["hybrid_car", "Uses both traditional and electric propulsion systems"],
              ["autonomous_vehicle", "Can function independently without a human driver"],
              ["electric_vehicle", "Powered exclusively by electricity"],
              ["chassis", "Supports the structure and components of the car"]
          ]
      },
      {
          "name": "engine",
          "description": "A machine designed to convert fuel into mechanical power to propel a vehicle.",
          "status": "vehicle component",
          "parents": ["car"],
          "relations": [
              ["internal_combustion_engine", "A subtype commonly used in traditional vehicles"],
              ["electric_motor", "Alternative energy converter in electric vehicles"],
              ["fuel_system", "Delivers fuel to power the engine"]
          ]
      },
            {
          "name": "vehicle_body",
          "description": "The outer shape and structure of a car.",
          "status": "vehicle component",
          "parents": ["car"],
          "relations": [
              ["status_and_style", "A car is seen by many as a status symbol because of its shape"],
              ["fuel_consumption", "The shape of a car influences its fuel consumption"]
            ]
      },
            {
          "name": "social_implications",
          "description": "The social importsance a car has",
          "status": "social",
          "parents": ["car", "transportation"],
          "relations": [
              ["car", "A car is seen by many as a status symbol because of its shape"],
              ["fuel_consumption", "The shape of a car influences its fuel consumption"]
            ]
      },
                  {
          "name": "status_and_style",
          "description": "statussymbols form a style",
          "status": "social",
          "parents": ["social_implications"],
          "relations": [
              ["car", "A car is seen by many as a status symbol because of its shape"],
              ["fuel_consumption", "The shape of a car influences its fuel consumption"]
            ]
      },
      {
          "name": "internal_combustion_engine",
          "description": "An engine that generates power by burning fuel and air inside a combustion chamber.",
          "status": "engine type",
          "parents": ["engine"],
          "relations": [
              ["car", "Historically the dominant propulsion system for cars"],
              ["hybrid_car", "Used alongside electric motors in hybrid vehicles"],
              ["fuel_system", "Depends on fuel systems to operate"]
          ]
      }]"`

};

if (!process.env.GITHUB_TOKEN) {
  console.error("The GITHUB_TOKEN environment variable is missing!");
  process.exit(1); 
}

const token = process.env.GITHUB_TOKEN;

// Function to summarize the text using Azure AI model
export async function main(text) {
  const client = new ModelClient(
    "https://models.inference.ai.azure.com", 
    new AzureKeyCredential(token)
  );

  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        { role: "system", content: "" },
        { role: "user", content: prompt(text) }
      ],
      model: "Llama-3.3-70B-Instruct",
      temperature: 0.8,
      max_tokens: 2048,
      top_p: 0.1
    }
  });

  if (response.status !== "200") {
    throw response.body.error;
  }
  return response.body.choices[0].message.content;
}

// POST route for summarizing text
app.post('/summarize', async (req, res) => {
  try {
    const text = req.body.text; // Get the text from the request body
    const summary = await main(text); // Call the summarization function
    res.json({ summary }); // Send the summary as a JSON response
  } catch (error) {
    res.status(500).send('Error summarizing text'); // Handle any errors
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});




