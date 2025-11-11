// functions/api/callback.js (デバッグ強化版)
export const onRequestGet = async ({ request, env }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const stateFromGithub = url.searchParams.get("state"); 

    const stateCookie = request.headers.get("Cookie")
      ?.split('; ')
      .find(row => row.startsWith('__Host-state='))
      ?.split('=')[1];

    if (!stateFromGithub || !stateCookie || stateFromGithub !== stateCookie) {
      console.error(`State Mismatch: GitHub State: ${stateFromGithub}, Cookie State: ${stateCookie}`);
      return new Response("State mismatch. Please verify your GitHub OAuth App Callback URL is correct.", { status: 403 });
    }

    if (!code) {
        return new Response("Missing code parameter. Authentication probably rejected.", { status: 400 });
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

    // --- デバッグの強化 ---
    const responseBody = await response.text();

    if (response.status !== 200) {
        return new Response(
            `GitHub Token Exchange Failed (Status ${response.status}): ${responseBody}`,
            { status: 500, headers: { "Content-Type": "text/plain" } }
        );
    }

    const result = JSON.parse(responseBody);
    // --- デバッグここまで ---

    if (result.error) {
        return new Response(
            `GitHub API Error: ${result.error_description || result.error}`,
            { status: 401, headers: { "Content-Type": "text/plain" } }
        );
    }

    if (!result.access_token) {
        return new Response("No access_token found in response.", { status: 500, headers: { "Content-Type": "text/plain" } });
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
              payload: { 
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