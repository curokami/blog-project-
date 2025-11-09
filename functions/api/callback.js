export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateFromGithub = url.searchParams.get("state"); // Get state from GitHub redirect

  // Read the __Host-state cookie
  const stateCookie = request.headers.get("Cookie")
    ?.split('; ')
    .find(row => row.startsWith('__Host-state='))
    ?.split('=')[1];

  // Log for debugging
  console.log("callback.js: GITHUB_CLIENT_ID:", env.GITHUB_CLIENT_ID);
  console.log("callback.js: stateFromGithub:", stateFromGithub);
  console.log("callback.js: stateCookie:", stateCookie);

  // State verification
  if (!stateFromGithub || !stateCookie || stateFromGithub !== stateCookie) {
    return new Response("State mismatch or missing state information.", { status: 403 });
  }

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

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

  if (result.error) {
    return new Response(result.error_description || result.error, {
      status: 401,
    });
  }

  // This part sends the token back to the CMS in the opener window
  return new Response(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Auth Callback</title>
      </head>
      <body>
        <script>
          window.opener.postMessage(
            {
              token: "${result.access_token}",
              provider: "github",
            },
            window.location.origin
          );
          window.close();
        </script>
      </body>
    </html>
    `,
    {
      headers: { "Content-Type": "text/html" },
    }
  );
};