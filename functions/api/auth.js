// functions/api/auth.js (最終版)
export const onRequestGet = async ({ request, env }) => {
  if (!env.GITHUB_CLIENT_ID) {
      return new Response("GitHub client credentials are not configured.", { status: 500 });
  }

  const url = new URL(request.url);
  
  // Decap CMSが渡すstateパラメータと、ランダム文字列を結合
  const cmsProvidedState = url.searchParams.get("state") || "no_cms_state";
  const randomString = Math.random().toString(36).slice(2);
  const stateData = `${cmsProvidedState}_${randomString}`; 

  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authUrl.searchParams.set("scope", "repo");
  authUrl.searchParams.set("state", stateData); // シンプルな文字列をGitHubに渡す

  return new Response(null, {
    status: 302,
    headers: {
      // Cookieにも同じシンプルな文字列を保存
      "Set-Cookie": `__Host-state=${stateData}; Secure; HttpOnly; SameSite=Lax; Path=/`,
      Location: authUrl.toString(),
    },
  });
};