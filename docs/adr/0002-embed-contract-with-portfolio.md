# Pong must work inside the portfolio's iframe

waynetellis.com shows Pong as its Easter egg by loading it full-screen in an iframe at `/workshop/pong` (portfolio-site `app/workshop/pong/page.tsx`), with the portfolio's own "back" link pinned top-left over the game. That link is the one we share with friends, so Pong treats the iframe as a first-class home: it must be fully playable embedded, keeps its own controls (such as the pause button) out of the top-left corner, never navigates the parent page, and hides its own link back to waynetellis.com when embedded because the portfolio's back link already does that job.

Site-level terms (Easter egg, Workshop, Zone) are owned by the portfolio's `CONTEXT.md`; Pong's `GLOSSARY.md` owns only game terms. A change to either side of this contract should be checked against the other repo.
