import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import cron from 'node-cron';
import dotenv from 'dotenv';
import express from 'express';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

// Load environment variables
dotenv.config();

// Constants
const app = express();
const DISCORD_API_URL = 'https://discord.com/api/v9';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const avatarsDir = path.join(__dirname, 'public', 'resources', 'avatars');

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

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

// Function to fetch channel details
async function fetchChannelDetails(channelId) {
  const url = `${DISCORD_API_URL}/channels/${channelId}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bot ${process.env.BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching channel details: ${response.statusText}`);
  }

  return response.json();
}

// Function to fetch member details
async function fetchMemberDetails(guildId, memberId) {
  const url = `${DISCORD_API_URL}/guilds/${guildId}/members/${memberId}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bot ${process.env.BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching member details: ${response.statusText}`);
  }

  return response.json();
}

// Function to fetch scheduled events
async function fetchScheduledEvents() {
  const url = `${DISCORD_API_URL}/guilds/${process.env.DISCORD_GUILD_ID}/scheduled-events`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bot ${process.env.BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching scheduled events: ${response.statusText}`);
  }

  const events = await response.json();

  // Add image URL, channel name, creator avatar URL, and creator nickname to events
  for (const event of events) {
    if (event.image) {
      event.image_url = `https://cdn.discordapp.com/guild-events/${event.id}/${event.image}.png?size=2048`;
    }

    if (event.channel_id) {
      const channelDetails = await fetchChannelDetails(event.channel_id);
      event.channel_name = channelDetails.name;
    }

    if (event.creator) {
      if (event.creator.avatar) {
        event.creator_avatar_url = `https://cdn.discordapp.com/avatars/${event.creator.id}/${event.creator.avatar}.png?size=2048`;
      }

      const memberDetails = await fetchMemberDetails(
        event.guild_id,
        event.creator.id
      );
      event.creator_nickname = memberDetails.nick || event.creator.username;
    }
  }

  // Save Events to JSON File in /public/json/events.json
  fs.writeFileSync(
    path.join(__dirname, 'data', 'events.json'),
    JSON.stringify(events, null, 2)
  );
}

// Schedule the task to run once a day
cron.schedule('0 0 * * *', fetchAndSaveAvatars);
cron.schedule('0 * * * *', fetchScheduledEvents);

// Initial fetch
fetchAndSaveAvatars();
fetchScheduledEvents();

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

app.get('/rent-a-server', (req, res) => {
  res.render('rent-a-server');
});

app.get('/merch-data', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM psg_merch_items');
    res.json(rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).send('Error fetching data');
  }
});

app.get('/events', (req, res) => {
  res.render('events');
});

app.get('/events-data', async (req, res) => {
  try {
    const events = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data', 'events.json'))
    );
    res.json(events);
  } catch (error) {
    console.error('Error reading events.json:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(process.env.SERVER_PORT, () => {
  console.log(`Server is running on ${process.env.WEB_DOMAIN}`);
});
