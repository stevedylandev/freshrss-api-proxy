import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = {
	FRESHRSS_URL: string;
	FRESHRSS_USERNAME: string;
	FRESHRSS_PASSWORD: string;
};

interface Category {
	id: string;
	label: string;
}

interface Feed {
	id: string;
	title: string;
	url: string;
	htmlUrl?: string;
	categories?: Category[];
	iconUrl?: string;
}

interface SubscriptionList {
	subscriptions: Feed[];
}

const app = new Hono<{ Bindings: Bindings }>();

app.use("/*", cors());

app.get("/", async (c) => {
	const format = c.req.query("format") || "json";

	const FRESHRSS_URL = c.env.FRESHRSS_URL;
	const FRESHRSS_USERNAME = c.env.FRESHRSS_USERNAME;
	const FRESHRSS_API_PASSWORD = c.env.FRESHRSS_PASSWORD;

	// Authenticate
	const authResponse = await fetch(
		`${FRESHRSS_URL}/api/greader.php/accounts/ClientLogin?Email=${FRESHRSS_USERNAME}&Passwd=${FRESHRSS_API_PASSWORD}`,
	);
	const authText = await authResponse.text();

	const match = authText.match(/Auth=(.+)/);
	if (!match) {
		return c.json({ error: "Authentication failed" }, 401);
	}

	const authToken = match[1].trim();

	// Get subscription list
	const response = await fetch(
		`${FRESHRSS_URL}/api/greader.php/reader/api/0/subscription/list?output=json`,
		{
			headers: {
				Authorization: `GoogleLogin auth=${authToken}`,
			},
		},
	);

	if (!response.ok) {
		return c.json({ error: `FreshRSS API error: ${response.statusText}` }, 500);
	}

	const data = (await response.json()) as SubscriptionList;

	if (data.subscriptions) {
		data.subscriptions = data.subscriptions.map(({ iconUrl, ...feed }) => feed);
	}

	// Return JSON format
	if (format === "json") {
		return c.json(data);
	}

	// Return OPML format
	if (format === "opml") {
		const now = new Date().toUTCString();
		const subscriptions = data.subscriptions || [];

		// Helper to escape XML
		const escapeXml = (str: string): string => {
			if (!str) return "";
			return str
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;")
				.replace(/'/g, "&apos;");
		};

		let opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Steve's Feeds</title>
    <dateCreated>${now}</dateCreated>
  </head>
  <body>
`;

		// Add all feeds
		subscriptions.forEach((feed: Feed) => {
			opml += `    <outline type="rss" text="${escapeXml(feed.title)}" title="${escapeXml(feed.title)}" xmlUrl="${escapeXml(feed.url)}" htmlUrl="${escapeXml(feed.htmlUrl || "")}" />
`;
		});

		opml += `  </body>
</opml>`;

		return c.body(opml, 200, {
			"Content-Type": "application/xml",
			"Content-Disposition": 'attachment; filename="feeds.opml"',
		});
	}

	return c.json(
		{ error: "Invalid format. Use ?format=json or ?format=opml" },
		400,
	);
});

export default app;
