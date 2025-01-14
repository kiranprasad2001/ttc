document.addEventListener("DOMContentLoaded", () => {
    const gridContainer = document.getElementById("grid-container");
    const searchBox = document.getElementById("search-box");
    let stopsData = [];
    let userLatitude, userLongitude;
  
    // Fetch and parse the CSV file
    fetch("stops.csv")
      .then((response) => response.text())
      .then((csvData) => {
        stopsData = parseCSV(csvData);
  
        // Get user's location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              userLatitude = position.coords.latitude;
              userLongitude = position.coords.longitude;
              const nearbyStops = getNearbyStops(userLatitude, userLongitude);
              displayStops(nearbyStops);
            },
            (error) => {
              console.error("Error getting location:", error);
              displayStops([]); // Show message if location not available
            }
          );
        } else {
          console.log("Geolocation is not supported by this browser.");
          displayStops([]); // Show message if geolocation is not supported
        }
      });
  
    // Function to parse CSV data
    function parseCSV(csvData) {
      const rows = csvData.split("\n");
      const headers = rows[0].split(",");
      const parsedData = [];
  
      for (let i = 1; i < rows.length; i++) {
        const data = rows[i].split(",");
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
  
    // Haversine formula for distance calculation
    function haversineDistance(lat1, lon1, lat2, lon2) {
      const R = 6371; // Earth's radius in km
      const dLat = deg2rad(lat2 - lat1);
      const dLon = deg2rad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) *
          Math.cos(deg2rad(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c * 1000; // Distance in meters
    }
  
    function deg2rad(deg) {
      return deg * (Math.PI / 180);
    }
  
    // Get nearby stops
    function getNearbyStops(latitude, longitude) {
      return stopsData
        .map((stop) => ({
          ...stop,
          distance: haversineDistance(
            latitude,
            longitude,
            parseFloat(stop.stop_lat),
            parseFloat(stop.stop_lon)
          ),
        }))
        .filter((stop) => stop.distance <= 500)
        .sort((a, b) => a.distance - b.distance);
    }
  
    // Display stops
    function displayStops(stops) {
      gridContainer.innerHTML = ""; // Clear previous results
  
      if (stops.length === 0) {
        gridContainer.innerHTML = "<p>No stops found within 500m.</p>";
        return;
      }
  
      stops.forEach((stop) => {
        const stopElement = document.createElement("div");
        stopElement.classList.add("grid-item");
      
        const backgroundImage = {
          Streetcar: "ttc_streetcar.webp",
          Bus: "ttc_bus.webp",
          All: "ttc_all.webp",
        }[stop.Type?.trim()] || "images.webp";
      
        const accessibilityIcon =
          stop.Accessibility === "1"
            ? `<svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" class="StopButton_AccessibleIcon__Y5D0A">
                <g fill-rule="nonzero" fill="none">
                    <path d="M2.924 0h16.152A2.938 2.938 0 0122 2.924v16.152A2.938 2.938 0 0119.076 22H2.924A2.938 2.938 0 010 19.076V2.924A2.938 2.938 0 012.924 0z" fill="#000"></path>
                    <path d="M2.924.724h16.152a2.2 2.2 0 012.2 2.2v16.152a2.2 2.2 0 01-2.2 2.2H2.924a2.198 2.198 0 01-2.2-2.2V2.924c0-1.19 1.01-2.2 2.2-2.2z" fill="#FFF"></path>
                    <path d="M2.924 1.476c-.802 0-1.475.673-1.475 1.475V19.1c0 .803.673 1.476 1.476 1.476h16.15c.803 0 1.476-.673 1.476-1.476V2.925c0-.803-.673-1.476-1.476-1.476H2.925V1.476z" fill="#0082C9"></path>
                    <path d="M18.17 16.073l-.363-1.036c-.596.208-1.19.44-1.76.648l-1.604-4.427H9.422l-.104-1.242h3.416V8.852H9.19L8.982 6.55c.802-.053 1.448-.725 1.448-1.528a1.53 1.53 0 00-1.526-1.527A1.53 1.53 0 007.713 5.98l.57 6.471h5.253l1.71 4.71 2.923-1.087zm-4.581-1.838c-.338 1.812-1.968 3.184-3.96 3.184-2.227 0-4.013-1.734-4.013-3.857 0-1.397.777-2.613 1.916-3.287L7.43 9.11c-1.709.802-2.9 2.484-2.9 4.451 0 2.718 2.278 4.944 5.1 4.944 1.966 0 3.675-1.087 4.528-2.666l-.568-1.604v-.001z" fill="#FFF"></path>
                </g>
            </svg>`
            : "";
      
        let typeIcons = "";
          if (stop.Type.trim() === "Bus" || stop.Type.trim() === "All") {
              typeIcons += `
                  <svg width="20" height="20" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                      <g fill="none" fill-rule="evenodd">
                        <path d="M24.842 6.715l1.028 7.833c.068.52.13 1.005.13 1.527v8.107a.538.538 0 01-.528.546H23.89v1.908c0 .754-.591 1.364-1.32 1.364-.729 0-1.318-.61-1.318-1.364v-1.908h-9.5v1.908c0 .754-.592 1.364-1.32 1.364-.729 0-1.32-.61-1.32-1.364v-1.908H7.528A.537.537 0 017 24.182v-8.107c0-.522.062-1.008.13-1.527l1.028-7.833c.475-3.62 16.21-3.62 16.684 0zm-2.273 14.74c.729 0 1.32-.611 1.32-1.364 0-.753-.591-1.364-1.32-1.364-.729 0-1.318.61-1.318 1.364 0 .753.59 1.363 1.318 1.363zm-12.214 0c.729 0 1.32-.611 1.32-1.364 0-.753-.591-1.364-1.32-1.364-.73 0-1.319.61-1.319 1.364 0 .753.59 1.363 1.32 1.363zM20.986 5.706c.437 0 .792.366.792.819a.805.805 0 01-.792.817h-8.972a.805.805 0 01-.792-.817c0-.453.355-.819.792-.819h8.972z" fill="#1E1E1E" fill-rule="nonzero"></path>
                        <path d="M9.903 16c-.813 0-1.581-.694-1.478-1.527l.666-5.27c.053-.416.333-.764.74-.764h13.338c.407 0 .688.348.74.764l.666 5.27c.104.833-.665 1.527-1.478 1.527H9.903zM21.175 5.5c.456 0 .825.447.825 1 0 .552-.37 1-.825 1h-9.35c-.456 0-.825-.448-.825-1 0-.553.37-1 .826-1h9.35z" fill="#FFF"></path>
                      </g>
                  </svg>
              `;
          }
          if (stop.Type.trim() === "Streetcar" || stop.Type.trim() === "All") {
              typeIcons += `
                  <svg width="20" height="20" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                      <g fill="none" fill-rule="evenodd">
                        <path d="M22.88 20.707a.735.735 0 00-.742.73c0 .402.332.728.742.728s.743-.326.743-.729a.736.736 0 00-.743-.729zm-12.759 0c.409 0 .741.327.741.73a.735.735 0 01-.74.728.736.736 0 01-.744-.729c0-.402.333-.729.743-.729zm6.379-.999c-.819 0-1.483.653-1.483 1.458 0 .805.664 1.46 1.483 1.46.82 0 1.484-.655 1.484-1.46 0-.805-.664-1.458-1.484-1.458zm-8.903 6.21l.445 1.75h16.917l.446-1.75H7.597zm3.265 2.332V30H9.378v-1.75H7.597l-.594-2.333v-7.584c0-.786-.026-1.553.08-2.333L8.19 7.833c.215-1.583 3.026-2.114 5.935-2.273v-.644c0-.316.256-.574.575-.583h1.502V2h.594v2.333H18.3c.32.01.576.267.576.583v.644c2.91.159 5.72.69 5.935 2.273L25.918 16c.106.78.079 1.547.079 2.333v7.584l-.592 2.333h-1.782V30h-1.485v-1.75H10.862zm1.04-21.292a.438.438 0 00-.445.437v.875a.435.435 0 00.445.437H21.1a.436.436 0 00.445-.437v-.875a.44.44 0 00-.445-.437h-9.197zm4.301 2.624h-6.34a.884.884 0 00-.882.763l-.79 5.853a.877.877 0 00.89.968h7.122V9.582zm.594 0h6.34c.453 0 .827.333.883.763l.79 5.853a.878.878 0 01-.89.968h-7.123V9.582z" fill="#000" fill-rule="nonzero"></path>
                        <path d="M16.797 9.582h6.34c.453 0 .827.333.883.763l.79 5.853a.878.878 0 01-.89.968h-7.123V9.582zM10.121 20.707c.409 0 .741.327.741.73a.735.735 0 01-.74.728.736.736 0 01-.744-.729c0-.402.333-.729.743-.729zM16.203 9.582h-6.34a.884.884 0 00-.882.763l-.79 5.853a.877.877 0 00.89.968h7.122V9.582zM11.902 6.958a.438.438 0 00-.445.437v.875a.435.435 0 00.445.437H21.1a.436.436 0 00.445-.437v-.875a.44.44 0 00-.445-.437h-9.197zM16.5 19.708c-.819 0-1.483.653-1.483 1.458 0 .805.664 1.46 1.483 1.46.82 0 1.484-.655 1.484-1.46 0-.805-.664-1.458-1.484-1.458zM22.88 20.707a.735.735 0 00-.742.73c0 .402.332.728.742.728s.743-.326.743-.729a.736.736 0 00-.743-.729zM7.597 25.917l.445 1.75h16.917l.446-1.75z" fill="#FFF"></path>
                      </g>
                  </svg>
              `;
          }

        const distanceString = stop.distance > 1000
          ? `${(stop.distance / 1000).toFixed(2)} km`
          : `${Math.round(stop.distance)} m`;
      
        stopElement.innerHTML = `
            <div class="background-image" style="background-image: url('assets/${backgroundImage}');"></div>
            <div class="accessibility-icon" style="position: absolute; top: 1px; left: 1px; z-index: 2; background-color: white; padding: 1px; border-radius: 1px;">${accessibilityIcon}</div>
            <div class="typeIcons" style="position: absolute; top: 1px; left: 1px; z-index: 2; background-color: white; padding: 1px; border-radius: 1px;">${typeIcons}</div>
            <div class="content">
                <h4>${stop.stop_name}</h4>
                <p>${stop.Routes} - ${distanceString}</p>
                <p>${stop.Direction}</p>
            </div>
        `;
      
        stopElement.addEventListener("click", () => {
          const smsUrl = `sms:898882?body=${stop.stop_code}`;
          window.location.href = smsUrl;
        });
      
        gridContainer.appendChild(stopElement);
      });
    }
  
    // Modal functionality
    const howItWorks = document.getElementById("how-it-works");
    const modal = document.getElementById("howItWorksModal");
    const closeModalButton = document.getElementById("closeModal");
  
    howItWorks.addEventListener("click", () => {
      modal.style.display = "block";
    });
  
    closeModalButton.addEventListener("click", () => {
      modal.style.display = "none";
    });
  
    window.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    });
  
    // Search functionality with distance priority
    searchBox.addEventListener("input", debounce(() => {
      const searchTerm = searchBox.value.toLowerCase();
      const filteredStops = stopsData.filter(
        (stop) =>
          (stop.stop_name?.toLowerCase().includes(searchTerm) || "") ||
          (stop.Routes?.toLowerCase().includes(searchTerm) || "") ||
          (stop.Direction?.toLowerCase().includes(searchTerm) || "")
      );
  
      const updatedStops = filteredStops.map((stop) => ({
        ...stop,
        distance: haversineDistance(
          userLatitude,
          userLongitude,
          parseFloat(stop.stop_lat),
          parseFloat(stop.stop_lon)
        ),
      }));
  
      updatedStops.sort((a, b) => a.distance - b.distance);
  
      displayStops(updatedStops);
    }, 300));
  
    function debounce(func, delay) {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
      };
    }
  });
  