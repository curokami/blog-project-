// functions/api/auth.js (Decap CMS標準の動作に合わせた版)
export const onRequestGet = async ({ request, env }) => {
    if (!env.GITHUB_CLIENT_ID) {
        return new Response("GitHub client credentials are not configured.", { status: 500 });
    }

    // Decap CMS が送らない state を Pages Function 側で強制的に生成する
    const generatedState = Math.random().toString(36).slice(2) + Date.now().toString();

    // redirect_uriはGitHub OAuth Appの設定と完全に一致させる必要がある
    const redirectUri = `${new URL(request.url).origin}/api/callback`;
    
    console.log('=== [AUTH] OAuth initiation ===');
    console.log('Request origin:', new URL(request.url).origin);
    console.log('Redirect URI:', redirectUri);

    const authUrl = new URL("https://github.com/login/oauth/authorize");
    authUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
    authUrl.searchParams.set("scope", "repo");
    authUrl.searchParams.set("state", generatedState);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    
    console.log('Auth URL:', authUrl.toString());

    // Decap CMS標準の動作: HTMLページを返し、authorizing:githubメッセージを送信してからリダイレクト
    return new Response(
        `<!DOCTYPE html>
        <html lang="ja">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Authorizing...</title>
          </head>
          <body>
            <script>
              // Decap CMS標準の動作: authorizing:githubメッセージを送信
              if (window.opener && !window.opener.closed) {
                try {
                  window.opener.postMessage("authorizing:github", window.location.origin);
                  console.log('✓ Sent authorizing:github message');
                } catch (error) {
                  console.error('✗ Error sending authorizing message:', error);
                }
              }
              
              // メッセージ送信後、GitHub OAuthにリダイレクト
              setTimeout(() => {
                window.location.href = ${JSON.stringify(authUrl.toString())};
              }, 100);
            </script>
            <p>認証を開始しています...</p>
          </body>
        </html>`,
        {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                // stateをCookieに保存（callback.jsで検証する用）
                "Set-Cookie": `oauth_state=${generatedState}; Secure; HttpOnly; SameSite=None; Path=/; Max-Age=600`,
            },
        }
    );
};