import requests
import zipfile
import io
import pandas as pd
import os
import shutil

# API Endpoint for Open Data Toronto Package Metadata
PACKAGE_API_URL = "https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_show"
PACKAGE_ID = "ttc-routes-and-schedules"
OUTPUT_FILE = "stops.csv"

def get_download_url():
    """Queries the API to find the current ZIP file URL."""
    print(f"Fetching package metadata for '{PACKAGE_ID}'...")
    try:
        params = {"id": PACKAGE_ID}
        response = requests.get(PACKAGE_API_URL, params=params)
        response.raise_for_status()
        data = response.json()
        
        if not data.get("success"):
            print("API call failed to retrieve package info.")
            return None
            
        resources = data["result"]["resources"]
        
        # Find the ZIP resource
        for resource in resources:
            if resource["format"].upper() == "ZIP" and not resource["datastore_active"]:
                print(f"Found active dataset: {resource['name']}")
                return resource["url"]
                
        print("Error: Could not find a ZIP resource in the package.")
        return None

    except Exception as e:
        print(f"Error fetching metadata: {e}")
        return None

def determine_direction(headsigns):
    """
    Attempts to guess cardinal direction from a list of trip headsigns.
    E.g. "Line 1 towards Finch" -> Northbound
    """
    text = " ".join(headsigns).upper()
    if "NORTH" in text: return "Northbound"
    if "SOUTH" in text: return "Southbound"
    if "EAST" in text: return "Eastbound"
    if "WEST" in text: return "Westbound"
    return "Unknown" # Fallback

def download_and_extract_stops():
    # 1. Get the dynamic URL
    zip_url = get_download_url()
    if not zip_url:
        print("Could not retrieve download URL. Aborting.")
        return

    # 2. Download the file
    print(f"Downloading data from {zip_url}...")
    try:
        response = requests.get(zip_url)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error downloading data: {e}")
        return

    # 3. Process GTFS Data
    print("Download complete. Processing GTFS files (this may take a minute)...")
    try:
        with zipfile.ZipFile(io.BytesIO(response.content)) as z:
            # Check for required files
            required_files = ['stops.txt', 'routes.txt', 'trips.txt', 'stop_times.txt']
            if not all(f in z.namelist() for f in required_files):
                print(f"Error: Missing one of {required_files} in the archive.")
                return

            # --- A. Load STOPS ---
            print("Loading stops...")
            with z.open('stops.txt') as f:
                stops_df = pd.read_csv(f)
                # Keep essential columns
                # accessibility: 1 = some wheelchair access, 2 = no, 0 = no info. 
                # We map 1->1 (Access), others->0 for simplicity or keep raw.
                stops_df = stops_df[['stop_id', 'stop_code', 'stop_name', 'stop_lat', 'stop_lon', 'wheelchair_boarding']]
                stops_df.rename(columns={'wheelchair_boarding': 'Accessibility'}, inplace=True)
                # Ensure stop_code exists
                stops_df = stops_df.dropna(subset=['stop_code'])
                stops_df['stop_code'] = stops_df['stop_code'].astype(int)

            # --- B. Load ROUTES ---
            print("Loading routes...")
            with z.open('routes.txt') as f:
                routes_df = pd.read_csv(f)
                routes_df = routes_df[['route_id', 'route_short_name', 'route_type']]
                # Map route_type to string (3=Bus, 0=Tram/Streetcar, 1=Subway)
                type_map = {3: 'Bus', 0: 'Streetcar', 1: 'Subway', 2: 'Rail'}
                routes_df['Type'] = routes_df['route_type'].map(type_map).fillna('Bus')

            # --- C. Load TRIPS ---
            print("Loading trips...")
            with z.open('trips.txt') as f:
                trips_df = pd.read_csv(f)
                # We need trip_headsign to guess direction
                trips_df = trips_df[['trip_id', 'route_id', 'trip_headsign']]

            # --- D. Load STOP_TIMES (The big one) ---
            print("Loading stop_times (this is large)...")
            with z.open('stop_times.txt') as f:
                # Optimized: Only load trip_id and stop_id
                stop_times_df = pd.read_csv(f, usecols=['trip_id', 'stop_id'])
                # Remove duplicates to shrink size (we just need to know if a trip stops there)
                stop_times_df = stop_times_df.drop_duplicates()

            # --- E. Merge Data ---
            print("Merging data to find routes for each stop...")
            
            # 1. Join Stop Times -> Trips
            merged = pd.merge(stop_times_df, trips_df, on='trip_id', how='inner')
            
            # 2. Join -> Routes
            merged = pd.merge(merged, routes_df, on='route_id', how='inner')
            
            # 3. Aggregate per stop
            # We want: List of Routes, Direction (inferred), Type
            print("Aggregating routes per stop...")
            
            def aggregate_stop_info(group):
                # Unique routes
                routes = sorted(list(set(group['route_short_name'].astype(str))))
                routes_str = " | ".join(routes)
                
                # Type (take the first one, usually stops are single type)
                trans_type = group['Type'].iloc[0]
                
                # Direction (Try to guess based on headsigns)
                # This is an approximation. 
                direction = determine_direction(group['trip_headsign'].dropna().unique())
                
                return pd.Series([routes_str, direction, trans_type], index=['Routes', 'Direction', 'Type'])

            stop_info = merged.groupby('stop_id').apply(aggregate_stop_info).reset_index()

            # --- F. Final Merge with Stops ---
            final_df = pd.merge(stops_df, stop_info, on='stop_id', how='left')

            # Fill NaN for stops with no scheduled trips
            final_df['Routes'] = final_df['Routes'].fillna('')
            final_df['Direction'] = final_df['Direction'].fillna('')
            final_df['Type'] = final_df['Type'].fillna('Bus')
            
            # Reorder columns to match your CSV format
            # stop_id,stop_code,stop_name,stop_lat,stop_lon,Routes,Direction,Accessibility,Type
            cols = ['stop_id', 'stop_code', 'stop_name', 'stop_lat', 'stop_lon', 'Routes', 'Direction', 'Accessibility', 'Type']
            final_df = final_df[cols]

            # Save to CSV
            final_df.to_csv(OUTPUT_FILE, index=False)
            
            print(f"Success! Processed {len(final_df)} stops.")
            print(f"Saved to {os.path.abspath(OUTPUT_FILE)}")
                
    except zipfile.BadZipFile:
        print("Error: The downloaded file is not a valid zip file.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    download_and_extract_stops()