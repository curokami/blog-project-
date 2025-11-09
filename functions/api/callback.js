export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const { code, state } = url.searchParams;

  const storedState = request.headers.get("Cookie")?.match(/__Host-state=([^;]+)/)?.[1];
  if (!storedState || storedState !== state) {
    return new Response("State mismatch", { status: 400 });
  }

  const { site_id } = JSON.parse(storedState);

  console.log("callback.js: GITHUB_CLIENT_ID:", env.GITHUB_CLIENT_ID);
  console.log("callback.js: GITHUB_CLIENT_SECRET:", env.GITHUB_CLIENT_SECRET);

  console.log("callback.js: GITHUB_CLIENT_ID:", env.GITHUB_CLIENT_ID);

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const result = await response.json();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head><meta charset="utf-8" /></head>
      <body>
        <script>
          const receiveMessage = (message) => {
            if (message.data.auth) {
              window.opener.postMessage(
                'authorization:github:success:${JSON.stringify(result)}',
                message.origin
              );
            }
          }
          window.addEventListener("message", receiveMessage, false);
          window.opener.postMessage({ auth: "github" }, "*");
        </script>
      </body>
    </html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html",
      "Set-Cookie": `__Host-state=; Secure; HttpOnly; SameSite=Lax; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    },
  });
};