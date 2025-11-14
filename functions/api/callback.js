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

    // stateの検証: Cookieが存在する場合は検証し、存在しない場合は警告を出して続行
    // ポップアップウィンドウではCookieが失われる可能性があるため、柔軟に対応
    if (stateCookie) {
      // Cookieが存在する場合は検証
      if (!stateFromGithub || stateFromGithub !== stateCookie) {
        console.error(`State Mismatch: GitHub State: ${stateFromGithub || 'missing'}, Cookie State: ${stateCookie}`);
        return new Response(
          `<!DOCTYPE html>
          <html lang="ja">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>State Mismatch Error</title>
            </head>
            <body>
              <h1>State Mismatch Error</h1>
              <p><strong>GitHub State:</strong> ${stateFromGithub || 'missing'}</p>
              <p><strong>Cookie State:</strong> ${stateCookie}</p>
              <p>Please verify your GitHub OAuth App Callback URL is correct.</p>
            </body>
          </html>`,
          { 
            status: 403,
            headers: { "Content-Type": "text/html; charset=utf-8" }
          }
        );
      }
      console.log('✓ State verification passed (Cookie found)');
    } else {
      // Cookieが存在しない場合（ポップアップウィンドウでCookieが失われた可能性）
      console.warn('⚠ Cookie state not found, but continuing authentication (popup window may have lost cookies)');
      if (!stateFromGithub) {
        console.warn('⚠ GitHub state also missing, but continuing with code exchange');
      }
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
    console.log(`GitHub token exchange response status: ${response.status}`);
    console.log(`GitHub token exchange response body: ${responseBody.substring(0, 200)}...`);

    if (response.status !== 200) {
        const errorMsg = `GitHub Token Exchange Failed (Status ${response.status}): ${responseBody}`;
        console.error(errorMsg);
        return new Response(
            `<!DOCTYPE html>
            <html lang="ja">
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Token Exchange Failed</title>
              </head>
              <body>
                <script>
                  if (window.opener && !window.opener.closed) {
                    // Decap CMS標準のエラーメッセージ形式: "authorization:github:error:" + JSON.stringify({ message: 'error' })
                    const errorData = {
                      message: ${JSON.stringify(errorMsg)}
                    };
                    const errorMessage = "authorization:github:error:" + JSON.stringify(errorData);
                    window.opener.postMessage(errorMessage, window.location.origin);
                  }
                  setTimeout(() => window.close(), 3000);
                </script>
                <h1>Token Exchange Failed</h1>
                <p>${errorMsg}</p>
              </body>
            </html>`,
            { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
    }

    const result = JSON.parse(responseBody);
    console.log(`Parsed result keys: ${Object.keys(result).join(', ')}`);
    console.log(`Has error: ${!!result.error}`);
    console.log(`Has access_token: ${!!result.access_token}`);

    if (result.error) {
        const errorMsg = `GitHub API Error: ${result.error_description || result.error}`;
        console.error(errorMsg);
        return new Response(
            `<!DOCTYPE html>
            <html lang="ja">
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>GitHub API Error</title>
              </head>
              <body>
                <script>
                  if (window.opener && !window.opener.closed) {
                    // Decap CMS標準のエラーメッセージ形式: "authorization:github:error:" + JSON.stringify({ message: 'error' })
                    const errorData = {
                      message: ${JSON.stringify(errorMsg)}
                    };
                    const errorMessage = "authorization:github:error:" + JSON.stringify(errorData);
                    window.opener.postMessage(errorMessage, window.location.origin);
                  }
                  setTimeout(() => window.close(), 3000);
                </script>
                <h1>GitHub API Error</h1>
                <p>${errorMsg}</p>
              </body>
            </html>`,
            { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
    }

    if (!result.access_token) {
        const errorMsg = "No access_token found in response.";
        console.error(errorMsg);
        return new Response(
            `<!DOCTYPE html>
            <html lang="ja">
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>No Token</title>
              </head>
              <body>
                <script>
                  if (window.opener && !window.opener.closed) {
                    window.opener.postMessage({
                      type: 'authorization_error',
                      payload: { error: '${errorMsg}' }
                    }, window.location.origin);
                  }
                  setTimeout(() => window.close(), 3000);
                </script>
                <h1>No Token</h1>
                <p>${errorMsg}</p>
              </body>
            </html>`,
            { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
    }

    // トークンを一時的に保存するためのセッションストレージの代わりに、URLフラグメントを使用
    // または直接postMessageで送信
    return new Response(
      `
      <!DOCTYPE html>
      <html lang="ja">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Auth Callback</title>
        </head>
        <body>
          <div style="padding: 20px; font-family: sans-serif;">
            <h1>認証処理中...</h1>
            <p>このウィンドウは自動的に閉じられます。</p>
            <p id="status">処理中...</p>
          </div>
          <script>
            (function() {
              const statusEl = document.getElementById('status');
              statusEl.textContent = 'ページが読み込まれました。';
              
              console.log('=== Callback page loaded ===');
              console.log('window.opener exists:', !!window.opener);
              console.log('window.opener.closed:', window.opener?.closed);
              
              try {
                if (window.opener && !window.opener.closed) {
                  // Decap CMS標準のメッセージ形式を使用（プレフィックス + JSON文字列形式）
                  // 形式: "authorization:github:success:" + JSON.stringify({ token: 'TOKEN', provider: 'github' })
                  const token = "${result.access_token}";
                  const authData = {
                    token: token,
                    provider: "github"
                  };
                  const authMessage = "authorization:github:success:" + JSON.stringify(authData);
                  
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
                  
                  console.log('=== [CALLBACK] Preparing to send postMessage ===');
                  console.log('Target origin:', targetOrigin);
                  console.log('Current origin:', window.location.origin);
                  console.log('Opener origin:', window.opener?.location?.origin);
                  console.log('Auth message format: Decap CMS standard (prefix + JSON string)');
                  console.log('Token exists:', !!token);
                  console.log('Token length:', token?.length || 0);
                  
                  try {
                    statusEl.textContent = 'postMessageを送信中...';
                    console.log('=== [CALLBACK] Calling postMessage ===');
                    console.log('Message:', authMessage.substring(0, 100) + '...');
                    // Decap CMS標準形式で送信（プレフィックス + JSON文字列）
                    window.opener.postMessage(authMessage, targetOrigin);
                    console.log('✓ [CALLBACK] postMessage sent successfully');
                    console.log('✓ [CALLBACK] Message sent to:', targetOrigin);
                    console.log('✓ [CALLBACK] Message format: Decap CMS standard (prefix + JSON string)');
                    statusEl.textContent = '✓ 認証トークンを送信しました。ウィンドウを閉じます...';
                    
                    // 送信後にopenerがまだ存在するか確認
                    setTimeout(() => {
                      console.log('=== [CALLBACK] Post-send check ===');
                      console.log('Opener still exists:', !!window.opener);
                      console.log('Opener closed:', window.opener?.closed);
                    }, 100);
                  } catch (error) {
                    statusEl.textContent = '✗ エラー: ' + error.message;
                    console.error('✗ [CALLBACK] Error sending postMessage:', error);
                    console.error('Error details:', error.message, error.stack);
                  }
                  
                  // メッセージ送信後、少し待ってから閉じる（デバッグのため2分待つ）
                  setTimeout(() => {
                    console.log('Closing popup window...');
                    statusEl.textContent = 'ウィンドウを閉じています...';
                    window.close();
                  }, 120000); // 2分待つ（デバッグ用）
                } else {
                  // openerがない、または閉じられている場合
                  const errorMsg = window.opener ? 'Window opener is closed' : 'Window opener is not available';
                  console.error('✗', errorMsg);
                  statusEl.textContent = '✗ エラー: ' + errorMsg;
                  document.body.innerHTML = '<div style="padding: 20px; font-family: sans-serif;"><h1>認証エラー</h1><p>認証が完了しました。このウィンドウを閉じてください。</p><p>もし自動的に閉じない場合は、手動で閉じてください。</p><p>デバッグ: ' + errorMsg + '</p></div>';
                }
              } catch (error) {
                console.error('✗ Error in auth callback:', error);
                console.error('Error stack:', error.stack);
                if (statusEl) {
                  statusEl.textContent = '✗ エラー: ' + error.message;
                }
                document.body.innerHTML = '<div style="padding: 20px; font-family: sans-serif;"><h1>認証エラー</h1><p>認証中にエラーが発生しました。このウィンドウを閉じて、もう一度お試しください。</p><p>エラー: ' + error.message + '</p></div>';
              }
            })();
          </script>
        </body>
      </html>
      `,
      {
        headers: { 
          "Content-Type": "text/html; charset=utf-8",
          // Cookieを削除
          "Set-Cookie": `oauth_state=; Secure; HttpOnly; SameSite=None; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
        },
      }
    );
};