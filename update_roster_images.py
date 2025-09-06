import json
import requests

def validate_image_url(url):
    """
    Validate if an image URL is accessible.
    """
    try:
        response = requests.head(url, timeout=5)
        return response.status_code == 200
    except requests.RequestException:
        return False

def update_player_images():
    # Read the current roster
    try:
        with open('currentroster.json', 'r') as file:
            roster = json.load(file)
    except FileNotFoundError:
        print("Error: currentroster.json not found in the directory.")
        return
    except json.JSONDecodeError:
        print("Error: Failed to parse currentroster.json.")
        return

    # Update roster data with validated image URLs
    updated_roster = []
    for player in roster:
        image_url = player.get('player_image', '')
        if image_url and validate_image_url(image_url):
            print(f"Valid image found for {player['player_name']}")
        else:
            print(f"Invalid or missing image for {player['player_name']}. Please update.")
        
        # Add player to updated roster
        updated_roster.append(player)

    # Write the updated roster to a new JSON file
    with open('currentroster_02.json', 'w') as file:
        json.dump(updated_roster, file, indent=4)
    print("\nUpdated roster has been saved to currentroster_02.json.")

if __name__ == "__main__":
    update_player_images()