# Data in runtopsy

### Activity

- `id`: The unique id of the activity
- `type`: The activity type, e.g. "running"
- `start_time`: ISO-formatted timestamp of the local time at the start of the activity
- `end_time`: ISO-formatted timestamp of the local time at the end of the activity
- `distance`: Total distance, in m
- `moving_time`: Moving time, in s
- `avg_speed`: Average speed, in m/s
- `track_polyline`: An encoded polyline of the track of the activity, e.g. `wxjH}ir@u@bHiItA@nOrEzWA|GzACbWvEpThTvDqDLwJpAsCtFdAnGqClM`...
- `records`: An array of ActivityRecords

### ActivityRecord

- `time`: Time elapsed since the start of the activity, in s
- `distance`: Distance at this point, in m
- `speed`: Speed at this point, in m/s
- `position`: An array of lat and lng, e.g. `[48.98900957778096, 8.410555282607675]`
