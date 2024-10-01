import axios from 'axios';

async function getServers() {
  const apikey = process.env.PSG_API_KEY;
  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${apikey}`,
  };

  try {
    const response = await axios.get(
      'https://control.psg-hosting.com/api/client/servers',
      {
        headers: headers,
        withCredentials: true,
      }
    );

    console.log(response.data.data);
  } catch (error) {
    console.error('Error fetching servers:', error);
  }
}

getServers();
