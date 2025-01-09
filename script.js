document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-container');
    const searchBox = document.getElementById('search-box');
    let stopsData = [];
    let userLatitude, userLongitude;
    let stopsDataPromise = fetch('stops.csv')
    .then(response => response.text())
    .then(csvData => parseCSV(csvData));

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
                    displayStops([]); // Show message if location not available
                });
            } else {
                console.log("Geolocation is not supported by this browser.");
                displayStops([]); // Show message if geolocation is not supported
            }
        });

    // Function to parse CSV data
    function parseCSV(csvData) {
        const rows = csvData.split('\n');
        const headers = rows[0].split(',');
        const parsedData = [];

        for (let i = 1; i < rows.length; i++) {
            const data = rows[i].split(',');
            if (data.length === headers.length) {
                const stopData = {};
                for (let j = 0; j < headers.length; j++) {
                    stopData[headers[j].trim()] = data[j].trim();
                }
                parsedData.push(stopData);
            }
        }
        return parsedData;
    }

    // Function to calculate distance using the Haversine formula
    function haversineDistance(lat1, lon1, lat2, lon2) {
        if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return Infinity; // Handle invalid inputs
        const R = 6371; // Earth's radius in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1000; // Distance in meters
    }

    function deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    // Get nearby stops based on browser location
    function getNearbyStops(latitude, longitude) {
        return stopsData
            .map(stop => ({
                ...stop,
                distance: haversineDistance(latitude, longitude, parseFloat(stop.stop_lat), parseFloat(stop.stop_lon))
            }))
            // Filter stops within 500m first. if it works, will try more options like segregated distances
            .filter(stop => stop.distance <= 500)
            .sort((a, b) => a.distance - b.distance);
    }

    // Display stops in the grid
    function displayStops(stops) {
        gridContainer.innerHTML = ''; // Clear previous results

        if (stops.length === 0) {
            gridContainer.innerHTML = '<p>No stops found within 1km.</p>';
            return;
        }

        stops.forEach(stop => {
            const stopElement = document.createElement('div');
            stopElement.classList.add('grid-item');

            const backgroundImage = {
                Streetcar: "ttc_streetcar.jpg",
                Bus: "ttc_bus.jpg",
                All: "ttc_all.jpg",
            }[stop.Type?.trim()] || "default.jpg";

            // Accessibility icon for stops with accessibility - took it from TTC website - Don't blame if it's wrong
            const accessibilityIcon = stop.Accessibility === "1"
                ? `<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.924 1.476c-.802 0-1.475.673-1.475 1.475V19.1c0 .803.673 1.476 1.476 1.476h16.15c.803 0 1.476-.673 1.476-1.476V2.925c0-.803-.673-1.476-1.476-1.476H2.925V1.476z" fill="#0082C9"></path>
                </svg>`
                : '';

            stopElement.innerHTML = `
                <div class="background-image" style="background-image: url('assets/${backgroundImage}');">
                    <div class="accessibility-icon">${accessibilityIcon}</div>
                </div>
                <div class="content">
                    <h4>${stop.stop_name}</h4>
                    <p>${stop.Routes} - ${Math.round(stop.distance || 0)}m</p>
                </div>
            `;

            stopElement.addEventListener('click', () => {
                const smsUrl = `sms:898882?body=${stop.stop_code}`;
                window.location.href = smsUrl;
            });

            gridContainer.appendChild(stopElement);
        });
    }

    // Search functionality with distance priority
    searchBox.addEventListener('input', () => {
        const searchTerm = searchBox.value.toLowerCase();
        const filteredStops = stopsData.filter(stop =>
            (stop.stop_name?.toLowerCase().includes(searchTerm) || '') ||
            (stop.Routes?.toLowerCase().includes(searchTerm) || '') ||
            (stop.Direction?.toLowerCase().includes(searchTerm) || '')
        );

        filteredStops.sort((a, b) => {
            const distanceA = haversineDistance(userLatitude, userLongitude, parseFloat(a.stop_lat), parseFloat(a.stop_lon));
            const distanceB = haversineDistance(userLatitude, userLongitude, parseFloat(b.stop_lat), parseFloat(b.stop_lon));
            return distanceA - distanceB;
        });

        displayStops(filteredStops);
    });
});
