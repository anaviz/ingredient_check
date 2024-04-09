# Ingredient Check

A web application designed to inform users about potential health risks associated with product ingredients. It captures an image of an ingredient list via camera, analyzes these ingredients for health risks through OpenAI's GPT-4-Vision-Preview, and displays this analysis.

## Overview

The application utilizes a client-server model, built with Node.js and Express for the backend, and EJS, Bootstrap, and vanilla JavaScript for the frontend. It incorporates OpenAI's GPT-4-Vision-Preview for ingredient analysis. The application architecture supports real-time camera access, image capture, and analysis rendering.

![ingredient-check](https://github.com/anaviz/ingredient_check/assets/4655004/c5039ff3-3b84-4b4d-8da6-bdf64614dfd6)

## Features

- Immediate camera access for ingredient list capture.
- Analysis of ingredient lists for health risks via OpenAI's GPT-4-Vision-Preview.
- Display of analyzed data, including health risks and explanations for each ingredient.
- Enhanced user interaction with real-time image capture, loading indicators during analysis, and recapture functionality.

## Getting started

### Requirements

- Node.js
- A modern web browser supporting HTML5 and JavaScript.

### Quickstart

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Rename `.env.example` to `.env` and configure the required settings, including `SESSION_SECRET` and `OPENAI_API_KEY`.
4. Start the application with `npm start`.
5. Access the application via `http://localhost:3000`.

### License

Copyright (c) 2024.
