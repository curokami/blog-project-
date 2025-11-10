// functions/api/callback.js (最終版)
export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateFromGithub = url.searchParams.get("state");

  const stateCookie = request.headers.get("Cookie")
    ?.split('; ')
    .find(row => row.startsWith('__Host-state='))
    ?.split('=')[1];

  if (!stateFromGithub || !stateCookie || stateFromGithub !== stateCookie) {
    console.error(`State Mismatch: GitHub: ${stateFromGithub}, Cookie: ${stateCookie}`);
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

  return new Response(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Auth Callback</title>
      </head>
      <body>
        <script>
          const authData = {
            auth: {
              token: "${result.access_token}",
              provider: "github"
            },
            event: 'authenticate',
            name: 'github'
          };
          
          const targetOrigin = window.opener.location.origin;
          window.opener.postMessage(authData, targetOrigin);
          window.close();
        </script>
      </body>
    </html>
    `,
    {
      headers: { 
        "Content-Type": "text/html",
        "Set-Cookie": `__Host-state=; Secure; HttpOnly; SameSite=Lax; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
      },
    }
  );
};