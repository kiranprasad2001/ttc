document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-container');
    const searchBox = document.getElementById('search-box');
    let stopsData = [];
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
        const stopsWithin500m = [];
        const stopsWithin750m = [];
        const stopsWithin1km = [];

        stopsData.forEach(stop => {
            const distance = haversineDistance(latitude, longitude, parseFloat(stop.stop_lat), parseFloat(stop.stop_lon));
            if (distance <= 500) {
                stopsWithin500m.push({ ...stop, distance });
            } else if (distance <= 750) {
                stopsWithin750m.push({ ...stop, distance });
            } else if (distance <= 1000) {
                stopsWithin1km.push({ ...stop, distance });
            }
        });

        if (stopsWithin500m.length > 0) {
            return stopsWithin500m;
        } else if (stopsWithin750m.length > 0) {
            return stopsWithin750m;
        } else if (stopsWithin1km.length > 0) {
            return stopsWithin1km;
        } else {
            return [];
        }
    }

    // Display stops in the grid
    function displayStops(stops) {
        gridContainer.innerHTML = ''; // Clear previous results

        if (stops.length === 0) {
            gridContainer.innerHTML = '<p>No stops found within 1km.</p>';
            return;
        }

        stops.sort((a, b) => a.distance - b.distance);

        stops.forEach(stop => {
            const stopElement = document.createElement('div');
            stopElement.classList.add('grid-item');

            const backgroundImage = {
                Streetcar: "ttc_streetcar.jpg",
                Bus: "ttc_bus.jpg",
                All: "ttc_all.jpg",
            }[stop.Type.trim()] || "default.jpg";

            stopElement.innerHTML = `
                <div class="background-image" style="background-image: url('assets/${backgroundImage}');"></div>
                <div class="content">
                    <h4>${stop.stop_name}</h4>
                    <p>${stop.Routes} - ${Math.round(stop.distance)}m</p>
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
            stop.stop_name.toLowerCase().includes(searchTerm) ||
            stop.Routes.toLowerCase().includes(searchTerm) ||
            stop.stop_code.toLowerCase().includes(searchTerm)
        );

        filteredStops.sort((a, b) => {
            const distanceA = haversineDistance(userLatitude, userLongitude, parseFloat(a.stop_lat), parseFloat(a.stop_lon));
            const distanceB = haversineDistance(userLatitude, userLongitude, parseFloat(b.stop_lat), parseFloat(b.stop_lon));
            return distanceA - distanceB;
        });

        displayStops(filteredStops);
    });
});
