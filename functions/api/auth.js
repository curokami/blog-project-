// functions/api/auth.js (redirect_uriをGitHub OAuth Appの設定と一致させる版)
export const onRequestGet = async ({ request, env }) => {
    if (!env.GITHUB_CLIENT_ID) {
        return new Response("GitHub client credentials are not configured.", { status: 500 });
    }

    // Decap CMS が送らない state を Pages Function 側で強制的に生成する
    const generatedState = Math.random().toString(36).slice(2) + Date.now().toString();

    // redirect_uriはGitHub OAuth Appの設定と完全に一致させる必要がある
    // パラメータを含めない（GitHubがCallback URLと完全一致を要求するため）
    const redirectUri = `${new URL(request.url).origin}/api/callback`;
    
    console.log('=== [AUTH] OAuth initiation ===');
    console.log('Request origin:', new URL(request.url).origin);
    console.log('Redirect URI:', redirectUri);
    console.log('Expected GitHub OAuth App Callback URL: https://blog-project-398.pages.dev/api/callback');
    console.log('Match:', redirectUri === 'https://blog-project-398.pages.dev/api/callback');

    const authUrl = new URL("https://github.com/login/oauth/authorize");
    authUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
    authUrl.searchParams.set("scope", "repo");
    authUrl.searchParams.set("state", generatedState); // 生成した state を GitHub に渡す
    authUrl.searchParams.set("redirect_uri", redirectUri); // GitHub OAuth Appの設定と一致させる
    
    console.log('Auth URL:', authUrl.toString());
    console.log('Client ID:', env.GITHUB_CLIENT_ID ? `${env.GITHUB_CLIENT_ID.substring(0, 10)}...` : 'missing');

    return new Response(null, {
        status: 302,
        headers: {
            // stateをCookieに保存（callback.jsで検証する用）
            // SameSite=None; Secure を設定してポップアップウィンドウでもCookieが共有されるようにする
            "Set-Cookie": `oauth_state=${generatedState}; Secure; HttpOnly; SameSite=None; Path=/; Max-Age=600`,
            Location: authUrl.toString(),
        },
    });
};