document.addEventListener('DOMContentLoaded', () => {

  const searchBox = document.getElementById('search-box');
  const gridContainer = document.getElementById('grid-container'); // Get the main grid container

  fetch('stops.csv')
    .then(response => response.text())
    .then(csvData => {
      const rows = csvData.split('\n');
      const headers = rows[0].split(',');

      // Get unique directions from the CSV data
      const directions = [...new Set(rows.slice(1).map(row => row.split(',')[3]))]; 

      // Create grid containers dynamically based on directions
      const gridContainers = {};
      directions.forEach(direction => {
        const container = document.createElement('div');
        container.classList.add('container');
        container.id = `grid-container-${direction.toLowerCase().replace(/\s+/g, '-')}`;

        const heading = document.createElement('h2');
        heading.textContent = `Going ${direction}`;

        gridContainer.appendChild(heading);
        gridContainer.appendChild(container);

        gridContainers[direction] = container;
      });

      function addGridItem(stopData) {
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item');
        gridItem.dataset.recipient = '898882';
        gridItem.dataset.body = stopData['Stop ID'];

        gridItem.innerHTML = `
          <h3>${stopData['Stop Name']}</h3>
          <p>${stopData['Intersection']}</p>
          <p>Going ${stopData['Going Towards']}</p>
          <p>Check timings</p>
        `;

        const direction = stopData['Going Towards'];
        if (gridContainers[direction]) {
          gridContainers[direction].appendChild(gridItem);
        }

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
		
		const direction = stopData['Going Towards'];
        if (gridContainers[direction]) {
          gridContainers[direction].appendChild(gridItem);
        }
      }

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

      searchBox.addEventListener('input', () => {
        const searchTerm = searchBox.value.toLowerCase();
        gridContainer.innerHTML = '';

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
      });
    })
    .catch(error => {
      console.error("Error loading stop data:", error);
    });

  function setTheme() {
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 18 || hour < 6) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  setTheme();
});