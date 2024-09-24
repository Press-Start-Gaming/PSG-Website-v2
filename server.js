import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public'));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

// Start the server
app.listen(process.env.SERVER_PORT, () => {
  console.log(`Server is running on ${process.env.WEB_DOMAIN}`);
});
