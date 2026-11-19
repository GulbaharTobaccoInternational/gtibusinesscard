# Appreciation endpoint and future email delivery

The four permanent reactions call `POST /api/feedback`. **No email provider is installed or connected.** The route deliberately invokes `deliverFeedback(notification)` without a transport and returns `{ "mode": "demo", "sent": false }`. Merely supplying credentials cannot activate delivery. There is no mailto link, mail-client launch, database or persistent reaction archive.

Only the whitelisted reaction ID, supported company ID and UUID submission ID are accepted. Extra visitor, recipient or employee fields are rejected. The server creates the event time, derives company/reaction labels from the existing registry and identifies the visitor as **Anonymous (not authenticated)**. No identity is inferred from the employee form, browser or IP address.

The server prepares an email subject/body and these two default recipients:

- `slavomir.kluziak@gulbahartobacco.com`
- `vinu@gulbahartobacco.com`

An optional future server-only `MR_GHASHI_FEEDBACK_RECIPIENTS` comma-separated configuration is validated and deduplicated. This update creates or changes no environment variables or deployment settings. Recipient configuration and future credentials belong in server code only; the client imports reaction definitions and response types.

Requests require same-origin JSON, pass through the existing bounded-body reader and reject cross-site submissions. A process-salted HMAC key separates abuse prevention from visitor identity. The endpoint uses Vercel's [forwarded request headers](https://vercel.com/docs/headers/request-headers); raw IPs are neither stored in notifications nor logged. Repeated UUIDs receive 409, and more than ten unique submissions in a minute receive 429 with Retry-After. Memory is bounded to 2,048 active keys and entries expire. Responses are no-store. Browser requests time out after eight seconds, and failures display brief, honest feedback without blocking card controls.

The current limiter and duplicate guard are **process-local, best-effort demo protections**. Before enabling real delivery across Vercel instances, connect a shared rate-limit/idempotency store or equivalent provider protection. No store or infrastructure is provisioned in this phase.

Future activation requires an explicit server-only `FeedbackTransport` adapter whose `send` method resolves only after confirmed provider acceptance and rejects on failure. It receives the UUID as an idempotency key. Connect that adapter in the route only after configuring a verified sender/provider and deployment-wide abuse protection. The default null transport remains safe and inactive in the meantime. Neither the adapter interface nor this documentation activates or sends email.
