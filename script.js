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
                ? `<svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" class="StopButton_AccessibleIcon__Y5D0A">
                        <g fill-rule="nonzero" fill="none">
                            <path d="M2.924 0h16.152A2.938 2.938 0 0122 2.924v16.152A2.938 2.938 0 0119.076 22H2.924A2.938 2.938 0 010 19.076V2.924A2.938 2.938 0 012.924 0z" fill="#000"></path>
                            <path d="M2.924.724h16.152a2.2 2.2 0 012.2 2.2v16.152a2.2 2.2 0 01-2.2 2.2H2.924a2.198 2.198 0 01-2.2-2.2V2.924c0-1.19 1.01-2.2 2.2-2.2z" fill="#FFF"></path>
                            <path d="M2.924 1.476c-.802 0-1.475.673-1.475 1.475V19.1c0 .803.673 1.476 1.476 1.476h16.15c.803 0 1.476-.673 1.476-1.476V2.925c0-.803-.673-1.476-1.476-1.476H2.925V1.476z" fill="#0082C9"></path>
                            <path d="M18.17 16.073l-.363-1.036c-.596.208-1.19.44-1.76.648l-1.604-4.427H9.422l-.104-1.242h3.416V8.852H9.19L8.982 6.55c.802-.053 1.448-.725 1.448-1.528a1.53 1.53 0 00-1.526-1.527A1.53 1.53 0 007.713 5.98l.57 6.471h5.253l1.71 4.71 2.923-1.087zm-4.581-1.838c-.338 1.812-1.968 3.184-3.96 3.184-2.227 0-4.013-1.734-4.013-3.857 0-1.397.777-2.613 1.916-3.287L7.43 9.11c-1.709.802-2.9 2.484-2.9 4.451 0 2.718 2.278 4.944 5.1 4.944 1.966 0 3.675-1.087 4.528-2.666l-.568-1.604v-.001z" fill="#FFF"></path>
                        </g>
                    </svg>`
                : '';

            // Display distance in km if more than 1km
            const distanceString = stop.distance > 1000
                ? (stop.distance / 1000).toFixed(2) + "km"
                : Math.round(stop.distance) + "m";    

            stopElement.innerHTML = `
                <div class="background-image" style="background-image: url('assets/${backgroundImage}');"></div>
                <div class="accessibility-icon" style="position: absolute; top: 1px; left: 1px; z-index: 2; background-color: white; padding: 1px; border-radius: 1px;">${accessibilityIcon}</div>
                <div class="content">
                    <h4>${stop.stop_name}</h4>
                    <p>${stop.Routes} - ${Math.round(stop.distance || 0)}m</p>
                    <p>${stop.Direction}</p>
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

        // Recalculating distance for filteredStops
        const updatedStops = filteredStops.map(stop => ({
            ...stop,
            distance: haversineDistance(userLatitude, userLongitude, parseFloat(stop.stop_lat), parseFloat(stop.stop_lon))
        }));

        updatedStops.sort((a, b) => {
            const distanceA = haversineDistance(userLatitude, userLongitude, parseFloat(a.stop_lat), parseFloat(a.stop_lon));
            const distanceB = haversineDistance(userLatitude, userLongitude, parseFloat(b.stop_lat), parseFloat(b.stop_lon));
            return distanceA - distanceB; 
        });

        displayStops(updatedStops);

    });
});
