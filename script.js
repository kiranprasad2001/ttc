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
      gridItem.dataset.recipient = '89882';
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
        const recipient = item.dataset.recipient;
        const body = item.dataset.body;

        try {
          const smsUrl = `sms:${recipient}?body=${encodeURIComponent(body)}`;
          window.open(smsUrl, '_blank');
        } catch (error) {
          console.error("Error opening SMS app:", error);
          alert("Oops! There was an error opening the messaging app.");
        }
      });
    }

    // Function to add event listeners to all grid items
    function addEventListenersToGridItems() {
      const gridItems = document.querySelectorAll('.grid-item');
      gridItems.forEach(item => {
        item.addEventListener('click', () => {
          const recipient = item.dataset.recipient;
          const body = item.dataset.body;

          try {
            const smsUrl = `sms:${recipient}?body=${encodeURIComponent(body)}`;
            window.open(smsUrl, '_blank');
          } catch (error) {
            console.error("Error opening SMS app:", error);
            alert("Oops! There was an error opening the messaging app.");
          }
        });
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
    addEventListenersToGridItems(); // Add event listeners to initially created grid items

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

          // Check if any of the stop data fields match the search term
          if (Object.values(stopData).some(value => value.toLowerCase().includes(searchTerm))) {
            addGridItem(stopData);
          }
        }
      }
      addEventListenersToGridItems(); // Add event listeners to newly created grid items
    });

  })
  .catch(error => {
    console.error("Error loading stop data:", error);
    // Handle the error (e.g., display an error message on the page)
  });
