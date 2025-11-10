// functions/api/auth.js (再修正版)
export const onRequestGet = async ({ request, env }) => {
  if (!env.GITHUB_CLIENT_ID) {
    console.error("Authentication Error: GITHUB_CLIENT_ID is not defined."); 
    return new Response("GitHub client credentials are not configured.", { status: 500 });
  }

  const url = new URL(request.url);

  // Decap CMS が渡した生の state パラメータをそのまま使用する
  const stateData = url.searchParams.get("state"); 
  
  if (!stateData) {
      // state がない場合は無効なリクエスト
      return new Response("Missing required state parameter from CMS.", { status: 400 });
  }

  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authUrl.searchParams.set("scope", "repo");
  authUrl.searchParams.set("state", stateData); // CMSから受け取った生のstateをそのままGitHubに渡す

  return new Response(null, {
    status: 302,
    headers: {
      // Cookieに CMS の生の state をそのまま保存
      "Set-Cookie": `__Host-state=${stateData}; Secure; HttpOnly; SameSite=Lax; Path=/`,
      Location: authUrl.toString(),
    },
  });
};