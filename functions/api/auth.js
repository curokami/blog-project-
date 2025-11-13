// functions/api/auth.js (stateをURLパラメータとして渡す版)
export const onRequestGet = async ({ request, env }) => {
    if (!env.GITHUB_CLIENT_ID) {
        return new Response("GitHub client credentials are not configured.", { status: 500 });
    }

    // Decap CMS が送らない state を Pages Function 側で強制的に生成する
    const generatedState = Math.random().toString(36).slice(2) + Date.now().toString();

    // redirect_uriを構築（GitHub OAuth Appの設定と一致させる必要がある）
    // stateをURLパラメータとしてcallbackに渡す（ポップアップウィンドウではCookieが失われるため）
    const redirectUri = `${new URL(request.url).origin}/api/callback?expected_state=${encodeURIComponent(generatedState)}`;

    const authUrl = new URL("https://github.com/login/oauth/authorize");
    authUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
    authUrl.searchParams.set("scope", "repo");
    authUrl.searchParams.set("state", generatedState); // 生成した state を GitHub に渡す
    authUrl.searchParams.set("redirect_uri", redirectUri); // redirect_uriを明示的に設定（stateを含む）

    return new Response(null, {
        status: 302,
        headers: {
            Location: authUrl.toString(),
        },
    });
};