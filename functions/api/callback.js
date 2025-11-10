// functions/api/callback.js (最終版: 認証後の画面遷移を確実にする)

export const onRequestGet = async ({ request, env }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const stateFromGithub = url.searchParams.get("state"); 

    // 1. Cookieから state を取得 (auth.js で設定した生成された state)
    const stateCookie = request.headers.get("Cookie")
      ?.split('; ')
      .find(row => row.startsWith('__Host-state='))
      ?.split('=')[1];

    // 2. State 検証 (セキュリティ上の検証は必須)
    if (!stateFromGithub || !stateCookie || stateFromGithub !== stateCookie) {
      console.error(`State Mismatch: GitHub State: ${stateFromGithub}, Cookie State: ${stateCookie}`);
      // GitHub App の設定でコールバック URL に誤りがないか再確認を促すメッセージを追加
      return new Response("State mismatch. Please verify your GitHub OAuth App Callback URL is correct.", { status: 403 });
    }

    if (!code) {
        return new Response("Missing code parameter. Authentication probably rejected.", { status: 400 });
    }

    // 3. GitHubからAccess Tokenを取得
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

    // 4. Decap CMS への最終ハンドシェイク (画面遷移の核心)
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Auth Callback</title>
        </head>
        <body>
          <script>
            // Decap CMS が要求する標準ペイロード構造
            const authData = {
              auth: {
                token: "${result.access_token}",
                provider: "github"
              },
              event: 'authorize', // イベント名を 'authorize' に変更
              name: 'github' 
            };
            
            // ポップアップを開いた親ウィンドウのオリジンに向けて送信
            const targetOrigin = window.opener.location.origin;

            // Decap CMS がメッセージを確実にキャッチできるように、少し遅延を入れて送信
            setTimeout(() => {
                window.opener.postMessage(authData, targetOrigin);
                window.close();
            }, 100); 
          </script>
        </body>
      </html>
      `,
      {
        headers: { 
          "Content-Type": "text/html",
          // Cookieのクリア
          "Set-Cookie": `__Host-state=; Secure; HttpOnly; SameSite=Lax; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
        },
      }
    );
};