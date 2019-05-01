# Runtopsy

A running app that shows your running activities on a calendar strip and on the map.

![Runtopsy Screenshot](https://user-images.githubusercontent.com/255637/57014668-68ccb200-6c11-11e9-903f-85a1a2cbeb70.png)

## [run‧top‧sy]

After-the-fact examination of your running activities.

## Setup

A config JSON file is expected at `$HOME/.running/config.json` in the user home directory.

```jsonc
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
