export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const site_id = url.searchParams.get("site_id");
  
  // Decap CMSから渡される state も含め、GitHubに送るためにJSON文字列として結合
  const cmsState = url.searchParams.get("state"); 
  const stateData = JSON.stringify({ site_id, cmsState, random: Math.random().toString(36).slice(2) });

  console.log("auth.js: GITHUB_CLIENT_ID:", env.GITHUB_CLIENT_ID);

  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authUrl.searchParams.set("scope", "repo");
  
  // GitHubに送る state に、CMSが期待するデータとランダムな検証データをセット
  authUrl.searchParams.set("state", stateData); 

  return new Response(null, {
    status: 302,
    headers: {
      // Cookieに stateData を保存
      "Set-Cookie": `__Host-state=${stateData}; Secure; HttpOnly; SameSite=Lax; Path=/`,
      Location: authUrl.toString(),
    },
  });
};