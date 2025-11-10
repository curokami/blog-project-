// functions/api/auth.js (最終版: stateをそのまま利用)
export const onRequestGet = async ({ request, env }) => {
    if (!env.GITHUB_CLIENT_ID) {
        return new Response("GitHub client credentials are not configured.", { status: 500 });
    }

    const url = new URL(request.url);
    const stateData = url.searchParams.get("state"); 
    
    if (!stateData) {
        // CMSからstateが来ない場合は、ルーティングかconfigの問題
        return new Response("Missing required state parameter from CMS.", { status: 400 });
    }

    const authUrl = new URL("https://github.com/login/oauth/authorize");
    authUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
    authUrl.searchParams.set("scope", "repo");
    authUrl.searchParams.set("state", stateData); 

    return new Response(null, {
        status: 302,
        headers: {
            "Set-Cookie": `__Host-state=${stateData}; Secure; HttpOnly; SameSite=Lax; Path=/`,
            Location: authUrl.toString(),
        },
    });
};