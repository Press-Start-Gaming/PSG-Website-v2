import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import cron from 'node-cron';
import dotenv from 'dotenv';
import express from 'express';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import session from 'express-session';
import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import flash from 'connect-flash';

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

// Session and Passport configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

passport.serializeUser((user, done) => {
  console.log('Serializing user:', user); // Debug statement
  done(null, {
    id: user.id,
    username: user.username,
    discriminator: user.discriminator,
    avatar: user.avatar,
    nickname: user.nickname,
  });
});

passport.deserializeUser(async (user, done) => {
  console.log('Deserializing user:', user); // Debug statement
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [
      user.id,
    ]);
    if (rows.length > 0) {
      done(null, rows[0]);
    } else {
      done(null, user);
    }
  } catch (err) {
    done(err, null);
  }
});

passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: `${process.env.WEB_DOMAIN}/auth/discord/callback`,
      scope: ['identify', 'guilds'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Fetch the user's guild member information
        const guildId = process.env.DISCORD_GUILD_ID;
        const response = await fetch(
          `${DISCORD_API_URL}/guilds/${guildId}/members/${profile.id}`,
          {
            headers: {
              Authorization: `Bot ${process.env.BOT_TOKEN}`,
            },
          }
        );
        const guildMember = await response.json();

        const nickname = guildMember.nick || profile.username;

        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [
          profile.id,
        ]);
        if (rows.length > 0) {
          // User exists, update their data
          await pool.query(
            'UPDATE users SET username = ?, discriminator = ?, avatar = ?, accessToken = ?, refreshToken = ?, nickname = ? WHERE id = ?',
            [
              profile.username,
              profile.discriminator,
              profile.avatar,
              accessToken,
              refreshToken,
              nickname,
              profile.id,
            ]
          );
        } else {
          // User does not exist, insert new user
          await pool.query(
            'INSERT INTO users (id, username, discriminator, avatar, accessToken, refreshToken, nickname) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
              profile.id,
              profile.username,
              profile.discriminator,
              profile.avatar,
              accessToken,
              refreshToken,
              nickname,
            ]
          );
        }
        // Pass only the necessary fields to the done callback
        return done(null, {
          id: profile.id,
          username: profile.username,
          discriminator: profile.discriminator,
          avatar: profile.avatar,
          nickname: nickname, // Include the nickname
        });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/discord');
}

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
    const isGif = avatarHash.startsWith('a_');
    const newExtension = isGif ? 'gif' : 'png';
    const oldExtension = isGif ? 'png' : 'gif';
    const newFilePath = path.join(avatarsDir, `${member}.${newExtension}`);
    const oldFilePath = path.join(avatarsDir, `${member}.${oldExtension}`);

    // Remove the old file if it exists
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }

    const url = `https://cdn.discordapp.com/avatars/${id}/${avatarHash}.${newExtension}`;
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(newFilePath, buffer);
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
        const isGif = event.creator.avatar.startsWith('a_');
        const extension = isGif ? 'gif' : 'png';
        event.creator_avatar_url = `https://cdn.discordapp.com/avatars/${event.creator.id}/${event.creator.avatar}.${extension}?size=2048`;
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
  console.log(req.user);
  res.render('index', { user: req.user });
});

app.get('/about', (req, res) => {
  res.render('about', { user: req.user, teamMembers });
});

app.get('/merch', (req, res) => {
  res.render('merch', { user: req.user });
});

app.get('/rent-a-server', (req, res) => {
  res.render('rent-a-server', { user: req.user });
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
  res.render('events', { user: req.user });
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

app.get('/tos', (req, res) => {
  res.render('tos', { user: req.user });
});

app.get('/privacy', (req, res) => {
  res.render('privacy', { user: req.user });
});

// Authentication routes
app.get('/login', (req, res) => {
  res.redirect('/auth/discord');
});

app.get('/auth/discord', passport.authenticate('discord'));

app.get(
  '/auth/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/' }),
  (req, res) => {
    console.log('Authenticated user:', req.user); // Debug statement
    res.redirect('/');
  }
);

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Error logging out:', err);
      return res.status(500).send('Error logging out');
    }
    res.redirect('/');
  });
});

// Example of a protected route
app.get('/protected', ensureAuthenticated, (req, res) => {
  console.log('Protected route user:', req.user); // Debug statement
  res.send(`Hello ${req.user.username}, you are authenticated!`);
});

app.get('/.well-known/acme-challenge/:content', function (req, res) {
  res.send(req.params.content);
});

app.get('/error', (req, res) => {
  const flashMessages = req.flash('Error');
  const message = flashMessages.length > 0 ? flashMessages[0] : '';
  res.render('error', { message: message, user: req.user });
});

// Place this code at the end of your route definitions
app.use(function (req, res, next) {
  req.flash('Error', 'The page you entered does no exist.');
  return res.redirect('/error');
});

// Start the server
app.listen(process.env.SERVER_PORT, () => {
  console.log(`Server is running on ${process.env.WEB_DOMAIN}`);
});
