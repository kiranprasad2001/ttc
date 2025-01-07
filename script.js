document.addEventListener('DOMContentLoaded', () => {
  const gridContainer = document.getElementById('grid-container');
  const searchBox = document.getElementById('search-box');

  fetch('stops.csv')
    .then(response => response.text())
    .then(csvData => {
      const rows = csvData.split('\n');
      const headers = rows[0].split(',');

      // Group stops by the "Direction" column
      const groupedStops = {};

      // Function to create and add a grid item
      function addGridItem(stopData) {
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item');
        gridItem.dataset.recipient = '898882';
        gridItem.dataset.body = stopData['stop_code'];

        gridItem.innerHTML = `
          <h4>${stopData['stop_name']}</h4>
          <p>${stopData['Routes']}</p>
        `;
		
		gridItem.addEventListener('click', () => {
			const recipient = gridItem.dataset.recipient;
			const body = gridItem.dataset.body;

			// Construct the SMS URL
			const smsUrl = `sms:${recipient}?body=${body}`;

			// Redirect to the SMS URL
			window.location.href = smsUrl;
		});

        return gridItem;
      }

      // Populate groupedStops with stops categorized by "Direction"
      for (let i = 1; i < rows.length; i++) {
        const data = rows[i].split(',');
        if (data.length === headers.length) {
          const stopData = {};
          for (let j = 0; j < headers.length; j++) {
            stopData[headers[j]] = data[j];
          }

          const category = stopData['Direction'].trim();
          if (!groupedStops[category]) {
            groupedStops[category] = [];
          }
          groupedStops[category].push(stopData);
        }
      }

      // Render grouped stops
      Object.keys(groupedStops).forEach(category => {
        const categoryContainer = document.createElement('div');
        categoryContainer.classList.add('category-container');

        // Create the category title
        const categoryTitle = document.createElement('h2');
        categoryTitle.textContent = `Direction: ${category}`; // Title for the category
        categoryContainer.appendChild(categoryTitle);

        // Create the grid for the category
        const grid = document.createElement('div');
        grid.classList.add('grid');
        
        // Add each stop in the category to the grid
        groupedStops[category].forEach(stopData => {
          const gridItem = addGridItem(stopData);
          grid.appendChild(gridItem);
        });

        categoryContainer.appendChild(grid);
        gridContainer.appendChild(categoryContainer);
      });

      // Search functionality
      searchBox.addEventListener('input', () => {
		const searchTerm = searchBox.value.toLowerCase();
		gridContainer.innerHTML = ''; // Clear the grid
		
		// Re-render grouped stops based on search term
		Object.keys(groupedStops).forEach(category => {
			const filteredStops = groupedStops[category].filter(stopData => {
				// Exclude 'stop_code' from the search
				const searchableValues = Object.entries(stopData)
					.filter(([key, _]) => key !== 'stop_code' && key !== 'stop_id' && key !== 'stop_lon' && key !== 'stop_lat')  // Exclude irrelevant fields to search
					.map(([_, value]) => value);

				return searchableValues.some(value =>
					value.toLowerCase().includes(searchTerm)
				);
			});
		
			if (filteredStops.length > 0) {
				const categoryContainer = document.createElement('div');
				categoryContainer.classList.add('category-container');
		
				const categoryTitle = document.createElement('h2');
				categoryTitle.textContent = `Direction ${category}`;
				categoryContainer.appendChild(categoryTitle);
			
				const grid = document.createElement('div');
				grid.classList.add('grid');
				filteredStops.forEach(stopData => {
					const gridItem = addGridItem(stopData);
					grid.appendChild(gridItem);
				});
		
				categoryContainer.appendChild(grid);
				gridContainer.appendChild(categoryContainer);
			}
		});
	  });

	  
    })
    .catch(error => {
      console.error("Error loading stop data:", error);
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

});
