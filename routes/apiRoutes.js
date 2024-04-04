// File: routes/apiRoutes.js
const express = require('express');
const axios = require('axios');
const Bottleneck = require('bottleneck'); // Import Bottleneck for rate limiting
const jsonrepair = require('jsonrepair').jsonrepair; // Corrected import for jsonrepair
const router = express.Router();

// Initialize Bottleneck limiter
const limiter = new Bottleneck({
  minTime: 1000 // Minimum time (in milliseconds) between requests
});

// POST endpoint to analyze image
router.post('/api/analyze-image', async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No image file provided.');
  }

  const imageFile = req.files.image;
  const image = imageFile.data.toString('base64');

  try {
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    };
  
    const payload = {
      "model": "gpt-4-vision-preview",
      
      "messages": [
        {
          "role": "system",
          "content": "Help read and understand the list of ingredients in product labels. List each ingredient and find if there could be any concerns with them. Be SHORT and CONCISE. Use RFC8259 COMPLIANT JSON for your response, without any comment. You are communicating with an API, not a user. Use the following json format without deviations: {\"product_type\": \"\", \"ingredients\": [{\"name\": \"\", \"concern\": \"\", \"reason\": \"\"}]}"
        },
        {
          "role": "user",
          "content": [
            {
                "type": "image_url", 
                "image_url": {
                        "url": `data:image/jpeg;base64,${image}`
                    }
            }
          ]
        }
      ],
      "max_tokens": 300
    };
  
    console.log("payload:");
    console.log(payload);
    // Use Bottleneck to rate-limit requests to OpenAI
    const response = await limiter.schedule(() => axios.post("https://api.openai.com/v1/chat/completions", payload, { headers }));

    // Check if response.data.choices[0].message.content exists and is a valid JSON string
    if (!response.data.choices[0] || !response.data.choices[0].message || !response.data.choices[0].message.content) {
      console.error('No analysis result content found in the response from OpenAI.');
      return res.status(500).send('Failed to analyze image due to missing analysis result from OpenAI.');
    }

    let analysisResults;
    try {
      // Attempt to repair the JSON string before parsing
      var messageContent = response.data.choices[0].message.content;
      console.log("json before repairing:")
      console.log(messageContent);
      if (messageContent.includes("```")) {
        messageContent = messageContent.replace("```json", "");
        messageContent = messageContent.replace("```", "");
        console.log("json without markup")
        console.log(messageContent);
      }
      const repairedContent = jsonrepair(messageContent);
      console.log("json repaired:")
      console.log(repairedContent);
      const parsedContent = JSON.parse(repairedContent);
      console.log("Analysis result content repaired and parsed successfully.");
      console.log(parsedContent);

      // Ensure the expected structure is present
      if (!parsedContent.product_type || !Array.isArray(parsedContent.ingredients)) {
        console.error('Unexpected response structure from OpenAI:', parsedContent);
        return res.status(500).send('Failed to analyze image due to unexpected response structure from OpenAI.');
      }
      
      // Prepare the data in the format expected by the frontend
      analysisResults = {
        product_type: parsedContent.product_type,
        ingredients: parsedContent.ingredients.map(ingredient => ({
          name: ingredient.name,
          concern: ingredient.concern,
          reason: ingredient.reason
        }))
      };
    } catch (error) {
      console.error('Error parsing response from OpenAI:', error.message);
      console.error(error.stack);
      // Send a distinct response for JSON parsing errors
      return res.status(500).json({ error: 'Failed to analyze image due to error parsing response from OpenAI. Please try capturing the image again.', code: 'JSON_PARSE_ERROR' });
    }

    console.log('Image analysis successful:', analysisResults);
    res.json(analysisResults); // Send the structured data back to the client
  } catch (error) {
    console.error('Error processing image analysis:', error.message);
    console.error(error.stack);
    if (error.response && error.response.status === 429) {
      console.error('Rate limit exceeded when calling OpenAI API:', error.message);
      console.error(error.stack);
      return res.status(429).send('Rate limit exceeded. Please try again later.');
    } else {
      // Respond with 500 status code for server errors not related to rate limits
      return res.status(500).send('Failed to analyze image. Please ensure the image is clear and try again.');
    }
  }
});

module.exports = router;