# FreshRSS Proxy

This is a simple Hono + Clouflare worker proxy that helps distribute and share the RSS feeds you are subscribed to with [FreshRSS](https://github.com/FreshRSS/FreshRSS). The goal is to provide programatic layers for practical applications such as [Blog Feeds](https://blogfeeds.net)

## Quickstart

Follow these steps to setup the FreshRSS proxy for your own instance:

1. Make sure [Bun](https://bun.sh) is installed

2. Clone and install dependencies

```bash
git clone https://github.com/stevedylandev/freshrss-api-proxy
cd freshrss-api-proxy
bun install
```

3. Setup `.dev.vars`

Create a new file in the root of the project called `.dev.vars` with the following values

```
FRESHRSS_URL=
FRESHRSS_USERNAME=
FRESHRSS_PASSWORD=
```

4. Start up the dev server and test

```bash
bun dev

curl http://localhost:8787?format=json
```

You can use either of the following formats with the query `?format=`

- `json` (default)
- `opml`

5. Deployment

Login with `wrangler` to your Cloudflare account

```bash
bunx wrangler login
```

Deploy with the `deploy` script

```bash
bun run deploy
```

Set the secret variables

```bash
# run these separately and provide the values when prompted
bunx wrangler secret put FRESHRSS_URL

bunx wrangler secret put FRESHRSS_USERNAME

bunx wrangler secret put FRESHRSS_PASSWORD
```

## Questions

Feel free to [contact me](mailto:contact@stevedylan.dev)!
