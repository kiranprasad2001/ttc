# TTC Message Sender Web App [website](https://ttc.spotrot.com)

This is a simple web app that allows users to quickly send pre-filled SMS messages to a specified number with information about TTC (Toronto Transit Commission) stops. It fetches stop data from a CSV file, displays it in a grid layout, and provides a search functionality to filter the stops.

## Features

*   **Grid layout:** Displays TTC stop information in a responsive grid.
*   **SMS functionality:** Sends pre-filled SMS messages with stop details when a grid item is clicked.
*   **Search:** Filters the stops based on a search term.
*   **Dark/light mode:** Automatically switches between dark and light modes based on the time of day.
*   **Header:** Includes a logo, navigation links ("Submit a Stop" and "About"), and a search bar.
*   **Footer:** Displays copyright information, a disclaimer, and a link to official TTC news.

## Approach

1.  **Data fetching:** Fetches TTC stop data from a CSV file (`stops.csv`).
2.  **Grid generation:** Dynamically creates grid items using the fetched data and adds them to the page.
3.  **SMS sending:** Uses the `sms:` URL scheme to open the device's messaging app with pre-filled recipient and message body.
4.  **Search:** Filters the displayed stops based on the search term entered by the user.
5.  **Dark/light mode:** Applies CSS classes to switch between dark and light modes based on the time of day.
6.  **Header and footer:** Uses HTML and CSS to create the header and footer with the required elements and styling.

## Files

*   `index.html`: Main HTML file for the web app.
*   `style.css`: CSS file for styling the app.
*   `script.js`: JavaScript file for fetching data, generating the grid, handling SMS sending, search functionality, and dark/light mode.
*   `stops.csv`: CSV file containing the TTC stop data.
*   `about.md`: Markdown file for the "About" page.

## Possible improvements

*   **Error handling:** Implement more robust error handling for data fetching, CSV parsing, and SMS sending.
*   **User input validation:** Add validation to the search input to prevent unexpected behavior.
*   **Styling:** Enhance the visual design and styling of the app.
*   **PWA:** Consider making the app a Progressive Web App (PWA) for offline access and other benefits. (**In Progress - Testing**)
*   **Two-way communication:** Explore options for two-way communication with a server to display SMS replies
*   **Advanced features:** Add more advanced features like real-time updates, trip planning, etc.

## Disclaimer

This web app is provided "as is" without any warranty, express or implied. Use it at your own risk.
