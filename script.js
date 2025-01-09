document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-container');
    const searchBox = document.getElementById('search-box');
    let stopsData =;
    let userLatitude, userLongitude;

    // Fetch and parse the CSV file
    fetch('stops.csv')
        .then(response => response.text())
        .then(csvData => {
            stopsData = parseCSV(csvData);

            // Get user's location
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {
                    userLatitude = position.coords.latitude;
                    userLongitude = position.coords.longitude;
                    const nearbyStops = getNearbyStops(userLatitude, userLongitude);
                    displayStops(nearbyStops);
                }, error => {
                    console.error("Error getting location:", error);
                    displayStops(stopsData); // Display all stops if location is not available
                });
            } else {
                console.log("Geolocation is not supported by this browser.");
                displayStops(stopsData); // Display all stops if geolocation is not supported
            }
        });

    // Function to parse CSV data
    function parseCSV(csvData) {
        const rows = csvData.split('\n');
        const headers = rows[0].split(',');
        const parsedData =;

        for (let i = 1; i < rows.length; i++) {
            const data = rows[i].split(',');
            if (data.length === headers.length) {
                const stopData = {};
                for (let j = 0; j < headers.length; j++) {
                    stopData[headers[j]] = data[j];
                }
                parsedData.push(stopData);
            }
        }
        return parsedData;
    }

    // Function to calculate distance between two coordinates (Haversine formula)
    function haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d * 1000; // Distance in meters
    }

    function deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    // Get nearby stops based on browser location
    function getNearbyStops(latitude, longitude) {
        const stopsWithin500m = [];
        const stopsWithin750m = [];
        const stopsWithin1km = [];

        stopsData.forEach(stop => {
            const distance = haversineDistance(latitude, longitude, parseFloat(stop.stop_lat), parseFloat(stop.stop_lon));
            if (distance <= 500) {
                stopsWithin500m.push(stop);
            } else if (distance <= 750) {
                stopsWithin750m.push(stop);
            } else if (distance <= 1000) {
                stopsWithin1km.push(stop);
            }
        });

        if (stopsWithin500m.length > 0) {
            return stopsWithin500m;
        } else if (stopsWithin750m.length > 0) {
            return stopsWithin750m;
        } else if (stopsWithin1km.length > 0) {
            return stopsWithin1km;
        } else {
            return null;
        }
    }

    // Display stops in the grid
    function displayStops(stops) {
        gridContainer.innerHTML = ''; // Clear previous results

        if (stops === null) {
            gridContainer.innerHTML = '<p>No stops found within 1km.</p>';
            return;
        }

        if (stops.length === 0) {
            gridContainer.innerHTML = '<p>No stops found.</p>';
            return;
        }

        stops.forEach(stop => {
            const stopElement = document.createElement('div');
            stopElement.classList.add('grid-item');
            stopElement.dataset.recipient = '898882';
            stopElement.dataset.body = stop['stop_code'];

            // Set the background image based on the "Type" column
            let backgroundImage = "";
            switch (stop.Type.trim()) {
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
                    backgroundImage = "images.jpg";
            }

            // Create the background image div
            const backgroundImageDiv = document.createElement('div');
            backgroundImageDiv.classList.add('background-image');
            if (backgroundImage) {
                backgroundImageDiv.style.backgroundImage = `url('assets/${backgroundImage}')`;
                backgroundImageDiv.loading = "lazy";
            }

            // Create the content div
            const contentDiv = document.createElement('div');
            contentDiv.classList.add('content');
            contentDiv.innerHTML = `
                <h4>${stop['stop_name']}</h4>
                <p>${stop['Routes']}</p>
            `;

            // Add click event listener to the content div
            contentDiv.addEventListener('click', () => {
                const recipient = stopElement.dataset.recipient;
                const body = stopElement.dataset.body;
                const smsUrl = `sms:${recipient}?body=${body}`;
                window.location.href = smsUrl;
            });

            // Append the background image and content divs to the grid item
            stopElement.appendChild(backgroundImageDiv);
            stopElement.appendChild(contentDiv);
            gridContainer.appendChild(stopElement);
        });
    }

    // Search functionality with distance priority
    searchBox.addEventListener('input', () => {
        const searchTerm = searchBox.value.toLowerCase();
        const filteredStops = stopsData.filter(stop => {
            // Check if any of the searchable fields include the search term
            return stop.stop_name.toLowerCase().includes(searchTerm) ||
                   stop.Routes.toLowerCase().includes(searchTerm) ||
                   stop.stop_code.toLowerCase().includes(searchTerm);
        });

        // Sort filteredStops by distance
        filteredStops.sort((a, b) => {
            const distanceA = haversineDistance(userLatitude, userLongitude, parseFloat(a.stop_lat), parseFloat(a.stop_lon));
            const distanceB = haversineDistance(userLatitude, userLongitude, parseFloat(b.stop_lat), parseFloat(b.stop_lon));
            return distanceA - distanceB;
        });

        displayStops(filteredStops);
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