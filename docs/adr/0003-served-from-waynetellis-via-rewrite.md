# Pong is served at waynetellis.com/pong through a portfolio rewrite

Pong stays in its own repo and deploys to GitHub Pages, but visitors reach it at `waynetellis.com/pong/`: the portfolio's Next.js config rewrites that path to the Pages build, the same pattern already used for `/rota`. The Easter egg iframe loads from that path, and Pong ships a web manifest scoped to `/pong/` so it can be added to a phone's home screen and opened fullscreen, including on iOS, which has no fullscreen API in the browser.

## Considered Options

- Subdomain (`pong.waynetellis.com`) via a GitHub Pages custom domain: rejected, needs DNS changes and a second address for no extra benefit.
- Copying the game into the portfolio repo: rejected, two copies to keep in sync.
- Leaving it on `footnote42.github.io`: rejected, a home-screen install from inside the iframe is impossible and the shared link would not be on Wayne's domain.

## Consequences

Pong's asset and module paths must work under the `/pong/` prefix as well as `/pong-redux/` on GitHub Pages.
