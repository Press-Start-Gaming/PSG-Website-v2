window.addEventListener('load', () => {
  fetch('/merch-data')
    .then((response) => response.json())
    .then((data) => {
      // Populate divs with the received JSON data
      const div = document.getElementById('merch-items-container');
      div.innerHTML = ''; // Clear any existing content

      data.forEach((item) => {
        // Create a new div for each item
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('merch-item');

        // Populate the item div with item data
        // Adjust the properties based on your actual data structure
        itemDiv.innerHTML = `
          <img src="/resources/merch/${item.name}.png" alt="${item.name}" onerror="this.onerror=null;this.src='/resources/PSGLogo.png';" />
          <h2>${item.name}</h2>
          <p>Price: ${item.price}</p>
          <p>Description: ${item.description}</p>
          <button class="buy-button">Join our Discord to Order</button>
        `;

        // Append the item div to the container
        div.appendChild(itemDiv);

        // Add event listeners to change button text on hover and route on click
        const buttons = document.querySelectorAll('.buy-button');
        buttons.forEach((button) => {
          button.addEventListener('mouseenter', () => {
            button.textContent = 'discord.gg/psg';
          });
          button.addEventListener('mouseleave', () => {
            button.textContent = 'Join our Discord to Order';
          });
          button.addEventListener('click', () => {
            window.open('https://discord.gg/psg', '_blank');
          });
        });
      });
    })
    .catch((error) => {
      console.error('Error:', error);
    });
});
