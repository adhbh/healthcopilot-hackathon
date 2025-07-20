from livekit import api

LIVEKIT_API_KEY = "APIjDgk9JKrPft9"
LIVEKIT_API_SECRET = "X2fifQrCKqYpOA0VDX4f34UdwWjBrheANr2XT5MtDp1D"

identity = "test-user"

# Grant access to any room by omitting the room name
video_grants = api.VideoGrants(room_join=True)

token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
token.identity = identity
token.grants = video_grants

jwt = token.to_jwt()

print("Identity:", identity)
print("Token (join any room):\n", jwt)