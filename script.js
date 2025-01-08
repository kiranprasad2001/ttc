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

                // Set the background image based on the "Type" column
                let backgroundImage = "";
                switch (stopData.Type.trim()) {
                    case "Streetcar":
                        backgroundImage = "ttc_streetcar.jpg";
                        break;
                    case "Bus":
                        backgroundImage = "ttc_bus.jpg";
                        break;
                    case "All":
                        backgroundImage = "ttc_all.jpg";
                        break;
                    default:
                        backgroundImage = "images.jpg"; // Or a default image if needed
                }

                // Create the background image div
                const backgroundImageDiv = document.createElement('div');
                backgroundImageDiv.classList.add('background-image');
                if (backgroundImage) {
                    backgroundImageDiv.style.backgroundImage = `url('assets/${backgroundImage}')`;
                }

                // Create the content div
                const contentDiv = document.createElement('div');
                contentDiv.classList.add('content');
                contentDiv.innerHTML = `
                    <h4>${stopData['stop_name']}</h4>
                    <p>${stopData['Routes']}</p>
                `;

                // Add click event listener to the content div
                contentDiv.addEventListener('click', () => {
                    const recipient = gridItem.dataset.recipient;
                    const body = gridItem.dataset.body;
                    const smsUrl = `sms:${recipient}?body=${body}`;
                    window.location.href = smsUrl;
                });

                // Append the background image and content divs to the grid item
                gridItem.appendChild(backgroundImageDiv);
                gridItem.appendChild(contentDiv);

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

                const categoryTitle = document.createElement('h2');
                categoryTitle.textContent = `Direction: ${category}`;
                categoryContainer.appendChild(categoryTitle);

                const grid = document.createElement('div');
                grid.classList.add('grid');
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

                Object.keys(groupedStops).forEach(category => {
                    const filteredStops = groupedStops[category].filter(stopData => {
                        const searchableValues = [stopData['stop_name'], stopData['Routes'], stopData['Direction']];
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
    setInterval(setTheme, 60000); // Update every minute
});
