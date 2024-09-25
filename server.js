import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import cron from 'node-cron';
import dotenv from 'dotenv';
import express from 'express';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Constants
const app = express();
const DISCORD_API_URL = 'https://discord.com/api/v9';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const avatarsDir = path.join(__dirname, 'public', 'resources', 'avatars');

const teamMembers = {
  gabevalentine: { id: '341610972303327233' },
  ignis: { id: '195606616479891456' },
  cruisectrl: { id: '107245713229877248' },
  kitty: { id: '180437458163466240' },
  rats: { id: '320001449771794433' },
  goofy: { id: '147164170528227335' },
  salparadise: { id: '155858177659895808' },
  mercenary: { id: '366085925337300992' },
};

async function fetchUserData(userId) {
  const response = await fetch(`${DISCORD_API_URL}/users/${userId}`, {
    headers: {
      Authorization: `Bot ${process.env.BOT_TOKEN}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch user data for ${userId}`);
  }
  return response.json();
}

async function fetchAndSaveAvatars() {
  for (const member in teamMembers) {
    const { id } = teamMembers[member];
    const userData = await fetchUserData(id);
    const avatarHash = userData.avatar;
    const url = `https://cdn.discordapp.com/avatars/${id}/${avatarHash}.png`;
    const response = await fetch(url);
    const buffer = await response.buffer();
    fs.writeFileSync(path.join(avatarsDir, `${member}.png`), buffer);
  }
}

// Schedule the task to run once a day
cron.schedule('0 0 * * *', fetchAndSaveAvatars);

// Initial fetch
fetchAndSaveAvatars();

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public'));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/about', (req, res) => {
  res.render('about', { teamMembers });
});

app.get('/merch', (req, res) => {
  res.render('merch');
});

// Start the server
app.listen(process.env.SERVER_PORT, () => {
  console.log(`Server is running on ${process.env.WEB_DOMAIN}`);
});
