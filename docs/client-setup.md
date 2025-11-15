# Client Mode Setup (Hosted)

This guide shows how a user joins a Host from the hosted client.

## Steps

1. Open the hosted client URL provided by your team.
2. When prompted, enter the Host URL (the proxy address shared by the Host), e.g. `https://my-host.example.com`.
3. Click Continue to save the Host URL.
4. Create an account (Sign Up) or Sign In to join the workspace on that Host.
5. After authentication, you’ll be redirected to the app.

## Changing the Host

- On the Sign Up/Sign In pages, the current Host is displayed. Click "Change" to update it at any time.

## Notes

- The Host URL is stored locally in your browser and used for authentication requests.
- If you land on auth pages without a Host configured, you’ll be redirected to the Enter Host screen.


## Host Quickstart (Local Proxy)

If you are the Host and want to expose your local environment for others to connect:

1. Open the app at `/setup`.
2. In the Docker section, click "Start Docker" to bring services up (uses Docker Engine API).
3. In the Minimal Proxy section, click "Start Proxy". This starts a localtunnel and displays a public URL.
4. Share that URL with your team. They will use it as the Host URL on the hosted client.

Notes:
- The proxy exposes the port defined by `TUNNEL_PORT` (defaults to 5173).
- You can stop the proxy anytime by clicking "Stop Proxy".
- For more on localtunnel usage, see the localtunnel README: `https://raw.githubusercontent.com/localtunnel/localtunnel/refs/heads/master/README.md`.

