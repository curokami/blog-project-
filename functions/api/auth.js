// functions/api/auth.js (最終ロバスト版)
export const onRequestGet = async ({ request, env }) => {
    if (!env.GITHUB_CLIENT_ID) {
        return new Response("GitHub client credentials are not configured.", { status: 500 });
    }

    // Decap CMS が送らない state を Pages Function 側で強制的に生成する
    const generatedState = Math.random().toString(36).slice(2) + Date.now().toString();

    // redirect_uriを構築（GitHub OAuth Appの設定と一致させる必要がある）
    const redirectUri = `${new URL(request.url).origin}/api/callback`;

    const authUrl = new URL("https://github.com/login/oauth/authorize");
    authUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
    authUrl.searchParams.set("scope", "repo");
    authUrl.searchParams.set("state", generatedState); // 生成した state を GitHub に渡す
    authUrl.searchParams.set("redirect_uri", redirectUri); // redirect_uriを明示的に設定

    return new Response(null, {
        status: 302,
        headers: {
            // 生成した state を Cookie に保存 (callback.js で検証する用)
            // Cloudflare Pagesでは通常のCookie名を使用（__Host-プレフィックスは環境によって動作しない可能性がある）
            "Set-Cookie": `state=${generatedState}; Secure; HttpOnly; SameSite=Lax; Path=/`,
            Location: authUrl.toString(),
        },
    });
};