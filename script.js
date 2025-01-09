document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-container');
    const searchBox = document.getElementById('search-box');
    const debouncedSearch = debounce(handleSearch, 300);
    let stopsData = [];
    let userLatitude, userLongitude;

    // Fetch and parse the CSV file
    const stopsDataPromise = fetch('stops.csv')
        .then(response => response.text())
        .then(parseCSV)
        .then(data => stopsData = data);

    // Get user's location and display nearby stops
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            userLatitude = position.coords.latitude;
            userLongitude = position.coords.longitude;

            stopsDataPromise.then(() => {
                const nearbyStops = getNearbyStops(userLatitude, userLongitude, 500);
                displayStops(nearbyStops);
            });
        }, handleLocationError);
    } else {
        handleLocationError();
    }

    // Function to parse CSV data
    function parseCSV(csvData) {
        const [headerRow, ...rows] = csvData.trim().split('\n');
        const headers = headerRow.split(',');
        return rows.map(row => {
            const values = row.split(',');
            return Object.fromEntries(headers.map((header, i) => [header.trim(), values[i]?.trim()]));
        });
    }

    // Calculate distance using the Haversine formula
    function haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(a)) * 1000; // Distance in meters
    }

    function deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    // Get nearby stops
    function getNearbyStops(latitude, longitude, maxDistance = Infinity) {
        return stopsData
            .map(stop => ({
                ...stop,
                distance: haversineDistance(latitude, longitude, +stop.stop_lat, +stop.stop_lon)
            }))
            .filter(stop => stop.distance <= maxDistance)
            .sort((a, b) => a.distance - b.distance);
    }

    // Display stops in the grid
    function displayStops(stops) {
        gridContainer.innerHTML = stops.length
            ? stops.map(createStopElement).join('')
            : '<p>No stops found within 500m.</p>';
    }

    // Create HTML for each stop
    function createStopElement(stop) {
        const distanceString = stop.distance > 1000
            ? `${(stop.distance / 1000).toFixed(2)} km`
            : `${Math.round(stop.distance)} m`;

        const backgroundImage = {
            Streetcar: "ttc_streetcar.jpg",
            Bus: "ttc_bus.jpg",
            All: "ttc_all.jpg",
        }[stop.Type?.trim()] || "default.jpg";

        const accessibilityIcon = stop.Accessibility === "1"
            ? `<svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" class="StopButton_AccessibleIcon__Y5D0A">
                    <g fill-rule="nonzero" fill="none">
                        <path d="M2.924 0h16.152A2.938 2.938 0 0122 2.924v16.152A2.938 2.938 0 0119.076 22H2.924A2.938 2.938 0 010 19.076V2.924A2.938 2.938 0 012.924 0z" fill="#000"></path>
                        <path d="M2.924.724h16.152a2.2 2.2 0 012.2 2.2v16.152a2.2 2.2 0 01-2.2 2.2H2.924a2.198 2.198 0 01-2.2-2.2V2.924c0-1.19 1.01-2.2 2.2-2.2z" fill="#FFF"></path>
                    </g>
                </svg>`
            : '';

        return `
            <div class="grid-item" data-sms-code="${stop.stop_code}">
                <div class="background-image" style="background-image: url('assets/${backgroundImage}');"></div>
                <div class="accessibility-icon">${accessibilityIcon}</div>
                <div class="content">
                    <h4>${stop.stop_name}</h4>
                    <p>${stop.Routes} - ${distanceString}</p>
                    <p>${stop.Direction}</p>
                </div>
            </div>
        `;
    }

    // Handle location error
    function handleLocationError() {
        console.error("Location access denied or unavailable.");
        stopsDataPromise.then(() => displayStops([]));
    }

    // Search functionality
    function handleSearch() {
        const searchTerm = searchBox.value.toLowerCase();
        const filteredStops = stopsData.filter(stop =>
            [stop.stop_name, stop.Routes, stop.Direction]
                .some(field => field?.toLowerCase().includes(searchTerm))
        );

        const updatedStops = filteredStops.map(stop => ({
            ...stop,
            distance: userLatitude && userLongitude
                ? haversineDistance(userLatitude, userLongitude, +stop.stop_lat, +stop.stop_lon)
                : Infinity
        }));

        displayStops(updatedStops.sort((a, b) => a.distance - b.distance));
    }

    // Debounce function for better performance
    function debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    }

    // Event delegation for grid items
    gridContainer.addEventListener('click', event => {
        const gridItem = event.target.closest('.grid-item');
        if (gridItem) {
            const smsUrl = `sms:898882?body=${gridItem.dataset.smsCode}`;
            window.location.href = smsUrl;
        }
    });

    // Attach debounced search handler
    searchBox.addEventListener('input', debouncedSearch);
});
