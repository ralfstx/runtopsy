# Runtopsy

A running app that shows your running activities on a calendar strip and on the map.

## [run‧top‧sy]

After-the-fact examination of your running activities.

## Setup

A config JSON file is expected at `$HOME/.running/config.json` file in the user home directory.

```json
{
  "importers": {
    "file": {
      "enabled": false, // to enable importing from the file system
      "importDir": "/path/to/a/folder/with/garmin-fit-files"
    },
    "strava": {
      "enabled": true, // to enable importing from Strava
      "client_id": 4711, // runtopsy client id, will be moved elsewhere
      "client_secret": "secret", // runtopsy secret, will be moved elsewhere
    }
  },
  "mapboxAccessToken": // Mapbox access token
}
```
