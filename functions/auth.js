// functions/auth.js (最小リダイレクト版)
export const onRequestGet = async ({ request, env }) => {
    if (!env.GITHUB_CLIENT_ID) {
        return new Response("GitHub client credentials are not configured.", { status: 500 });
    }

    const authUrl = new URL("https://github.com/login/oauth/authorize");
    
    // 必須パラメータのみを設定
    authUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
    authUrl.searchParams.set("scope", "repo");
    
    // デバッグのため、state は固定値を設定
    authUrl.searchParams.set("state", "STATIC_STATE_CHECK"); 

    return new Response(null, {
        status: 302,
        headers: {
            // Cookie も検証しない
            Location: authUrl.toString(),
        },
    });
};