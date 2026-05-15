# ClawMail API

Mock backend for [ClawMail](https://github.com/xclawpal/clawmail) — disposable email service.

Provides an in-memory implementation of the ClawMail backend contract for development and demos. Not suitable for production: messages are seeded on inbox creation and lost on restart.

## Endpoints

All endpoints require `Authorization: Bearer <API_TOKEN>`.

| Method | Path             | Purpose                          |
|--------|------------------|----------------------------------|
| GET    | `/`              | Health check                     |
| GET    | `/domains`       | List available domains           |
| POST   | `/generate`      | Create a new inbox               |
| GET    | `/inbox/:id`     | List messages for an inbox       |
| GET    | `/message/:id`   | Get one message                  |
| GET    | `/code/:id`      | Extract OTP from a message       |
| DELETE | `/email/:id`     | Delete an inbox                  |

## Local

```bash
npm install
API_TOKEN=dev-token-clawmail node server.js
```

Listens on `http://127.0.0.1:8787`.

## Deploy to Render

1. Fork this repo
2. New → Blueprint on [Render](https://render.com)
3. Connect the fork — `render.yaml` does the rest
4. `API_TOKEN` is auto-generated; copy it from the Render dashboard for the frontend `.env`

## Stack

- [Hono](https://hono.dev) — web framework
- `@hono/node-server` — Node.js adapter
- ES modules, Node 18+

## License

MIT
