document.addEventListener('DOMContentLoaded', () => {  // Ensure the DOM is fully loaded

  const gridContainer = document.getElementById('grid-container');
  const searchBox = document.getElementById('search-box');

  fetch('stops.csv')
    .then(response => response.text())
    .then(csvData => {
      const rows = csvData.split('\n');
      const headers = rows[0].split(',');

      // Function to create and add a grid item
      function addGridItem(stopData) {
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item');
        gridItem.dataset.recipient = '898882'; // Make sure this is the correct recipient number
        gridItem.dataset.body = stopData['Stop ID'];

        gridItem.innerHTML = `
            <h3>${stopData['Stop Name']}</h3>
            <p>${stopData['Intersection']}</p>
            <p>Going ${stopData['Going Towards']}</p>
            <p>Check timings</p>
          `;

        gridContainer.appendChild(gridItem);

        // Add event listener to the grid item
        gridItem.addEventListener('click', () => {
          const recipient = gridItem.dataset.recipient;
          const body = gridItem.dataset.body;

          try {
            const smsUrl = `sms:${recipient}?body=${encodeURIComponent(body)}`;
            window.open(smsUrl, '_blank');
          } catch (error) {
            console.error("Error opening SMS app:", error);
            alert("Oops! There was an error opening the messaging app.");
          }
        });
      }

      // Initial population of the grid
      for (let i = 1; i < rows.length; i++) {
        const data = rows[i].split(',');
        if (data.length === headers.length) {
          const stopData = {};
          for (let j = 0; j < headers.length; j++) {
            stopData[headers[j]] = data[j];
          }
          addGridItem(stopData);
        }
      }
      // addEventListenersToGridItems();  // No need to call this here

      // Search functionality
      searchBox.addEventListener('input', () => {
        const searchTerm = searchBox.value.toLowerCase();
        gridContainer.innerHTML = ''; // Clear the grid

        for (let i = 1; i < rows.length; i++) {
          const data = rows[i].split(',');
          if (data.length === headers.length) {
            const stopData = {};
            for (let j = 0; j < headers.length; j++) {
              stopData[headers[j]] = data[j];
            }

            if (Object.values(stopData).some(value => value.toLowerCase().includes(searchTerm))) {
              addGridItem(stopData);
            }
          }
        }
        // addEventListenersToGridItems(); // No need to call this here
      });

    })
    .catch(error => {
      console.error("Error loading stop data:", error);
      // Handle the error (e.g., display an error message on the page)
    });

  // Dark/light mode based on time of day
  function setTheme() {
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 18 || hour < 6) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  setTheme(); // Set the initial theme on page load

}); // End of DOMContentLoaded event listener