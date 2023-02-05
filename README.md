# Strava-App

Available at: [strava.bjm.me.uk](https://strava.bjm.me.uk)

## Features

- Fetch either your most recent runs or a specific run and view statistics (5k/10k time and pace etc.)
- Receive an email when a new run is uploaded including statistics.
- Merge two consecutive activities into one (note: start time is changed by 1 min. otherwise Strava detects as duplicate.)

## Setup

### Development Setup

- Setup a Strava API Application [here](https://www.strava.com/settings/api)
- Copy `sample.env` to `.env` and change values
- `docker-compose -f docker-compose-dev.yml up -d` to start the DB
- `npm ci` to install packages
- `npm run start:dev` to start the server: [localhost:3000](http://localhost:3000)

### Production Setup

- Setup a Strava API Application [here](https://www.strava.com/settings/api)
- Copy `sample.env` to `.env` and change values
- `docker-compose up -d` to start the DB and server
- Access the server: [localhost:3000](http://localhost:3000)

### Webhook Setup

- Make POST request to

    ```bash
    curl -X POST https://www.strava.com/api/v3/push_subscriptions \
      -F client_id=blah \
      -F client_secret=blah \
      -F 'callback_url=http://a-valid.com/url' \
      -F 'verify_token=STRAVA'
    ```

- Should respond with subscription ID on success
- Ensure verify_token parameter corresponds to VERIFY_TOKEN in .env file. Same goes for STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET
- [More info here](https://developers.strava.com/docs/webhooks/)
