// Load environment variables
require("dotenv").config();
const express = require("express");
const https = require('https');
const http = require('http');
const fs=require('fs');
const path=require('path');
const session = require("express-session");
const authRoutes = require("./routes/authRoutes");
const apiRoutes = require('./routes/apiRoutes'); // Include the new API routes
const fileUpload = require('express-fileupload'); // Import express-fileupload

if (!process.env.SESSION_SECRET || !process.env.OPENAI_API_KEY || !process.env.GOOGLE_API_KEY) {
  console.error("Error: config environment variables not set. Please create/edit .env configuration file.");
  process.exit(-1);
}

const app = express();
const port = process.env.PORT || 3000;

// HTTPS server options
const options = {
  key:fs.readFileSync(path.join(__dirname,'./cert/client-key.pem')),
  cert:fs.readFileSync(path.join(__dirname,'./cert/client-cert.pem'))
};

// Middleware to parse request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload()); // Use express-fileupload middleware

// Setting the templating engine to EJS
app.set("view engine", "ejs");

// Serve static files
app.use(express.static("public"));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // Note: In a production environment, it's recommended to use a persistent session store.
  }),
);

app.on("error", (error) => {
  console.error(`Server error: ${error.message}`);
  console.error(error.stack);
});

// Logging session creation and destruction
app.use((req, res, next) => {
  const sess = req.session;
  // Make session available to all views
  res.locals.session = sess;
  if (!sess.views) {
    sess.views = 1;
    console.log("Session created at: ", new Date().toISOString());
  } else {
    sess.views++;
    console.log(
      `Session accessed again at: ${new Date().toISOString()}, Views: ${sess.views}, User ID: ${sess.userId || '(unauthenticated)'}`,
    );
  }
  next();
});

// Authentication Routes
app.use(authRoutes);

// API Routes
app.use(apiRoutes); // Use the API routes for image analysis

// Root path response
app.get("/", (req, res) => {
  res.render("index");
});

// If no routes handled the request, it's a 404
app.use((req, res, next) => {
  res.status(404).send("Page not found.");
});

// Error handling
app.use((err, req, res, next) => {
  console.error(`Unhandled application error: ${err.message}`);
  console.error(err.stack);
  res.status(500).send("There was an error serving your request.");
});

http.createServer(app).listen(port,()=>{
  console.log(`Server running at http://localhost:${port}`);
});
https.createServer(options, app).listen(1337,()=>{
  console.log('Secure server running at https://localhost:1337')
});