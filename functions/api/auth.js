export const onRequestGet = async ({ request, env }) => {
  // 環境変数チェック
  if (!env.GITHUB_CLIENT_ID) {
      console.error("Authentication Error: GITHUB_CLIENT_ID is not defined."); 
      return new Response("GitHub client credentials are not configured.", { status: 500 });
  }

  const url = new URL(request.url);
  
  // Decap CMSが渡すstateパラメータをそのまま利用し、ランダム文字列で強化
  const cmsProvidedState = url.searchParams.get("state") || "no_cms_state";
  const randomString = Math.random().toString(36).slice(2);
  
  // GitHubとCookieに渡すためのシンプルな検証用文字列（JSON化しない）
  const stateData = `${cmsProvidedState}_${randomString}`;

  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authUrl.searchParams.set("scope", "repo");
  
  // シンプルな検証用文字列をGitHubに渡す
  authUrl.searchParams.set("state", stateData); 

  return new Response(null, {
    status: 302,
    headers: {
      // Cookieにも同じシンプルな文字列を保存
      "Set-Cookie": `__Host-state=${stateData}; Secure; HttpOnly; SameSite=Lax; Path=/`,
      Location: authUrl.toString(),
    },
  });
};