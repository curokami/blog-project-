// functions/auth/callback.js (認証コード取得とハンドシェイク)
export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  // const stateFromGithub = url.searchParams.get("state"); // state 検証はスキップ

  if (!code) {
    // GitHubからリダイレクトされたがcodeがない場合（認証拒否など）
    return new Response("Missing code parameter. Authentication probably rejected by user.", { status: 400 });
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
    return new Response(`GitHub Token Error: ${result.error_description || result.error}`, {
      status: 401,
    });
  }

  // Decap CMS への最終ハンドシェイク
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

          // 親ウィンドウへメッセージ送信
          window.opener.postMessage(authData, targetOrigin);
          window.close();
        </script>
      </body>
    </html>
    `,
    { headers: { "Content-Type": "text/html" } }
  );
};