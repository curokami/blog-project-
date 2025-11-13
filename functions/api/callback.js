// functions/api/callback.js (Cookieからstateを取得する版)
export const onRequestGet = async ({ request, env }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const stateFromGithub = url.searchParams.get("state"); 

    // Cookieヘッダーからstateを取得
    const cookieHeader = request.headers.get("Cookie") || "";
    const stateCookie = cookieHeader
      .split('; ')
      .find(row => row.startsWith('oauth_state='))
      ?.split('=')[1];

    console.log(`State verification: GitHub State: ${stateFromGithub}, Cookie State: ${stateCookie || 'missing'}`);
    console.log(`Cookie header: ${cookieHeader.substring(0, 100)}...`);

    if (!stateFromGithub || !stateCookie || stateFromGithub !== stateCookie) {
      console.error(`State Mismatch: GitHub State: ${stateFromGithub || 'missing'}, Cookie State: ${stateCookie || 'missing'}`);
      // デバッグ情報をHTMLレスポンスに含める（ブラウザで確認可能）
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head><title>State Mismatch Error</title></head>
          <body>
            <h1>State Mismatch Error</h1>
            <p><strong>GitHub State:</strong> ${stateFromGithub || 'missing'}</p>
            <p><strong>Cookie State:</strong> ${stateCookie || 'missing'}</p>
            <p><strong>Cookie Header:</strong> ${cookieHeader || 'empty'}</p>
            <p>Please verify your GitHub OAuth App Callback URL is correct.</p>
            <p><small>Check Cloudflare Dashboard logs for server-side console.log output.</small></p>
          </body>
        </html>`,
        { 
          status: 403,
          headers: { "Content-Type": "text/html" }
        }
      );
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
        redirect_uri: url.origin + "/api/callback", // 明示的に redirect_uri を追加
      }),
    });

    const responseBody = await response.text();

    if (response.status !== 200) {
        return new Response(
            `GitHub Token Exchange Failed (Status ${response.status}): ${responseBody}`,
            { status: 500, headers: { "Content-Type": "text/plain" } }
        );
    }

    const result = JSON.parse(responseBody);

    if (result.error) {
        return new Response(
            `GitHub API Error: ${result.error_description || result.error}`,
            { status: 401, headers: { "Content-Type": "text/plain" } }
        );
    }

    if (!result.access_token) {
        return new Response("No access_token found in response.", { status: 500, headers: { "Content-Type": "text/plain" } });
    }

    // トークンを一時的に保存するためのセッションストレージの代わりに、URLフラグメントを使用
    // または直接postMessageで送信
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Auth Callback</title>
        </head>
        <body>
          <script>
            (function() {
              console.log('=== Callback page loaded ===');
              console.log('window.opener exists:', !!window.opener);
              console.log('window.opener.closed:', window.opener?.closed);
              
              try {
                if (window.opener && !window.opener.closed) {
                  const authData = {
                    type: 'authorization_response',
                    payload: { 
                      token: "${result.access_token}", 
                      provider: "github"
                    }
                  };
                  
                  // オリジンを動的に取得（Cloudflare Pages用）
                  let targetOrigin;
                  try {
                    // 同一オリジンの場合、opener.location.originにアクセス可能
                    targetOrigin = window.opener.location.origin;
                    console.log('✓ Got targetOrigin from opener:', targetOrigin);
                  } catch (e) {
                    // クロスオリジンの場合（通常は発生しない）、現在のページのオリジンを使用
                    // Cloudflare Pagesでは、callbackとadminページは同一オリジンである必要がある
                    targetOrigin = window.location.origin;
                    console.log('⚠ Using current origin as targetOrigin:', targetOrigin);
                  }
                  
                  console.log('Sending auth data to opener:', {
                    targetOrigin: targetOrigin,
                    authData: { ...authData, payload: { ...authData.payload, token: '[REDACTED]' } }
                  });
                  
                  window.opener.postMessage(authData, targetOrigin);
                  console.log('✓ postMessage sent successfully');
                  
                  // メッセージ送信後、少し待ってから閉じる（デバッグのため2分待つ）
                  setTimeout(() => {
                    console.log('Closing popup window...');
                    window.close();
                  }, 120000); // 2分待つ（デバッグ用）
                } else {
                  // openerがない、または閉じられている場合
                  const errorMsg = window.opener ? 'Window opener is closed' : 'Window opener is not available';
                  console.error('✗', errorMsg);
                  document.body.innerHTML = '<p>認証が完了しました。このウィンドウを閉じてください。</p><p>もし自動的に閉じない場合は、手動で閉じてください。</p><p>デバッグ: ' + errorMsg + '</p>';
                }
              } catch (error) {
                console.error('✗ Error in auth callback:', error);
                console.error('Error stack:', error.stack);
                document.body.innerHTML = '<p>認証中にエラーが発生しました。このウィンドウを閉じて、もう一度お試しください。</p><p>エラー: ' + error.message + '</p>';
              }
            })();
          </script>
        </body>
      </html>
      `,
      {
        headers: { 
          "Content-Type": "text/html",
          // Cookieを削除
          "Set-Cookie": `oauth_state=; Secure; HttpOnly; SameSite=None; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
        },
      }
    );
};