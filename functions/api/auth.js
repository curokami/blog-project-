export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const { site_id } = url.searchParams;

  // 1. state値をJSON化し、Cookieに保存する値として使用
  const stateData = JSON.stringify({ site_id, random: Math.random().toString(36).slice(2) });

  const authUrl = new URL("https://github.com/login/oauth/authorize");
  
  // 2. GitHubに渡すパラメータを設定
  authUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authUrl.searchParams.set("scope", "repo");
  
  // 3. GitHubに、Cookieに保存する値と同じ state 文字列を渡す
  authUrl.searchParams.set("state", stateData); 

  // ★不要な行は削除またはコメントアウト
  // url.searchParams.set("state", new URL(request.url).searchParams.get("state")); 

  return new Response(null, {
    status: 302,
    headers: {
      // Cookieに stateData をそのまま保存
      "Set-Cookie": `__Host-state=${stateData}; Secure; HttpOnly; SameSite=Lax; Path=/`,
      Location: authUrl.toString(),
    },
  });
};