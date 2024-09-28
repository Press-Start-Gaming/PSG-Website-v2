window.addEventListener('load', () => {
  fetch('/events-data')
    .then((response) => response.json())
    .then((data) => {
      // Sort events by scheduled_start_time
      data.sort(
        (a, b) =>
          new Date(a.scheduled_start_time) - new Date(b.scheduled_start_time)
      );

      // Populate divs with the received JSON data
      const div = document.getElementById('events-calendar-container');
      div.innerHTML = ''; // Clear any existing content

      data.forEach((event) => {
        // Create a new div for each event
        const eventDiv = document.createElement('div');
        eventDiv.classList.add('event-tile');

        let location;

        if (event.entity_metadata && event.entity_metadata.location) {
          location = `<strong>Location:</strong> ${event.entity_metadata.location}`;
        } else if (event.channel_name) {
          location = `<strong>Voice Channel:</strong> <a class="link" href="https://discord.gg/psg" target="_blank" rel="noopener noreferrer">${event.channel_name}</a>`;
        } else {
          location = `<strong>Location:</strong> TBD`;
        }

        // Populate the div with event details
        eventDiv.innerHTML = `
          <div class="event-image">
            <img src="${event.image_url}" alt="${
          event.name
        }" onerror="this.onerror=null;this.src='/resources/PSGLogo.png';"/>
          </div>
          <div class="event-details">
            <h2>${event.name}</h2>
            <div class="host-info">
              <img class="host-avatar" src="${event.creator_avatar_url}" alt="${
          event.creator_nickname
        }" />
              <span class="host-name">${event.creator_nickname}</span>
            </div>
            <p>${event.description}</p>
            <p><strong>Start Time:</strong> ${new Date(
              event.scheduled_start_time
            ).toLocaleString()}</p>
            ${
              event.scheduled_end_time
                ? `<p><strong>End Time:</strong> ${new Date(
                    event.scheduled_end_time
                  ).toLocaleString()}</p>`
                : ''
            }
            <p>${location}</p>
            ${
              event.recurrence_rule
                ? `<p><strong>Recurrence:</strong> ${formatRecurrence(
                    event.recurrence_rule
                  )}</p>`
                : ''
            }
          </div>
        `;

        // Append the event div to the container
        div.appendChild(eventDiv);
      });
    })
    .catch((error) => {
      console.error('Error:', error);
    });
});

// Function to format recurrence rule
function formatRecurrence(recurrence) {
  const frequencyMap = {
    1: 'Daily',
    2: 'Weekly',
    3: 'Monthly',
    4: 'Yearly',
  };

  const weekdaysMap = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  let recurrenceText = `${frequencyMap[recurrence.frequency]} Every ${
    recurrence.interval > 1 ? `${recurrence.interval} Weeks` : 'Week'
  }`;

  if (recurrence.by_weekday) {
    const days = recurrence.by_weekday
      .map((day) => weekdaysMap[day])
      .join(', ');
    recurrenceText += ` on ${days}`;
  }

  if (recurrence.count) {
    recurrenceText += ` for ${recurrence.count} occurrences`;
  } else if (recurrence.end) {
    recurrenceText += ` until ${new Date(recurrence.end).toLocaleDateString()}`;
  }

  return recurrenceText;
}
