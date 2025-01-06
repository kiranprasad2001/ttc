const gridContainer = document.getElementById('grid-container');

fetch('stops.csv')  // Fetch the CSV file
  .then(response => response.text())
  .then(csvData => {
    const rows = csvData.split('\n'); // Split into rows
    const headers = rows[0].split(','); // Get the headers

    for (let i = 1; i < rows.length; i++) { // Start from the second row (data)
      const data = rows[i].split(',');
      if (data.length === headers.length) { // Make sure the row has all the data
        const stopData = {};
        for (let j = 0; j < headers.length; j++) {
          stopData[headers[j]] = data[j];
        }

        // Create a grid item element
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item');
        gridItem.dataset.recipient = '89882'; // Set the recipient (you might want to make this dynamic)
        gridItem.dataset.body = stopData['Stop ID']; // Set the message body (Stop ID)

        // Add content to the grid item
        gridItem.innerHTML = `
          <h3>${stopData['Stop Name']}</h3>
          <p>${stopData['Intersection']}</p>
          <p>Going ${stopData['Going Towards']}</p>
          <p>Check timings</p>
        `;

        // Add the grid item to the container
        gridContainer.appendChild(gridItem);
      }
    }

    // Add event listeners to the newly created grid items (same as before)
    // ... (rest of your event listener code from the previous example)
  })
  .catch(error => {
    console.error("Error loading stop data:", error);
    // Handle the error (e.g., display an error message on the page)
  });

