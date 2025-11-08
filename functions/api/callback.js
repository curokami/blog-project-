---
export const onRequest: PagesFunction = async ({ request, env, next }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookie = request.headers.get("Cookie");
  const cookieState = cookie
    ?.split(";")
    .find((c) => c.trim().startsWith("state="))
    ?.split("=")[1];

  if (state !== cookieState) {
    return new Response("State mismatch", { status: 401 });
  }

  const response = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "decap-cms-cloudflare-pages",
        accept: "application/json",
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    }
  );

  const result = await response.json();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Authorizing ...</title>
      </head>
      <body>
        <script>
          const receiveMessage = (message) => {
            window.opener.postMessage(
              'authorization:github:success:${JSON.stringify(result)}',
              message.origin
            );
            window.removeEventListener("message", receiveMessage, false);
          }
          window.addEventListener("message", receiveMessage, false);
          window.opener.postMessage("authorizing:github", "*");
        </script>
      </body>
    </html>
  `;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html",
      "Set-Cookie": `state=; HttpOnly; Path=/; Max-Age=0`,
    },
  });
};
