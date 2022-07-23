# Strava-App

View statistics on your Strava runs. Uses webhooks to send an email when a run is uploaded.

Available at: [strava.bjm.me.uk](https://strava.bjm.me.uk)

## Development Setup

- Setup a Strava API Application [here](https://www.strava.com/settings/api)
- Copy `sample.env` to `.env` and change values
- `docker-compose up -d`

## Production Setup

- Same as Development, but use `docker-compose-prod.yml` instead

## Webhook Setup

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
