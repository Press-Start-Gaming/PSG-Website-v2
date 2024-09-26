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

        // Remove newline and carriage return characters from the description
        const description = item.description.replace(
          /(\\n|\r\n|\n|\r)/g,
          '<br>'
        );

        // Populate the item div with item data
        // Adjust the properties based on your actual data structure
        itemDiv.innerHTML = `
          <img src="/resources/merch/${item.name}.png" alt="${item.name}" onerror="this.onerror=null;this.src='/resources/PSGLogo.png';" />
          <h2>${item.name}</h2>
          <p><b>Price:</b> ${item.price}</p>
          <p><i>Shipping Fees may apply.</i></p>
          <p><b>Description:</b> ${description}</p>
        `;

        // Variations
        if (item.variations !== null) {
          const variations = item.variations.replace(
            /(\\n|\r\n|\n|\r)/g,
            '<br>'
          );

          const variationsDiv = document.createElement('div');
          variationsDiv.innerHTML = `
            <p><b>Variations:</b> ${variations}</p>
          `;
          itemDiv.appendChild(variationsDiv);
        }

        // Customize
        if (item.customizable === 1) {
          const customizableOptions = item.customizableOptions.replace(
            /(\\n|\r\n|\n|\r)/g,
            '<br>'
          );

          const customizeDiv = document.createElement('div');
          customizeDiv.innerHTML = `
            <p><b>Customize:</b> ${customizableOptions}</p>
          `;
          itemDiv.appendChild(customizeDiv);
        }

        // Create a button container
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container');

        // Create a button for each item
        const button = document.createElement('button');
        button.classList.add('buy-button');
        if (item.available === 1) {
          button.textContent = 'Join our Discord to Order';

          // Add event listeners to change button text on hover and route on click
          button.addEventListener('mouseenter', () => {
            button.textContent = 'discord.gg/psg';
          });
          button.addEventListener('mouseleave', () => {
            button.textContent = 'Join our Discord to Order';
          });
          button.addEventListener('click', () => {
            window.open('https://discord.gg/psg', '_blank');
          });
        } else {
          button.textContent = 'Item Unavailable';
          button.classList.add('unavailable');
          button.disabled = true;
        }

        buttonContainer.appendChild(button);
        itemDiv.appendChild(buttonContainer);

        // Append the item div to the container
        div.appendChild(itemDiv);
      });
    })
    .catch((error) => {
      console.error('Error:', error);
    });
});
