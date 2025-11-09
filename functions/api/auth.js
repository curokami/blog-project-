export const onRequestGet = async ({ request, env }) => {
  console.log("auth.js: GITHUB_CLIENT_ID:", env.GITHUB_CLIENT_ID);
  const url = new URL(request.url);
  const { site_id } = url.searchParams;
  const state = JSON.stringify({ site_id, random: Math.random().toString(36).slice(2) });

  console.log("auth.js: GITHUB_CLIENT_ID:", env.GITHUB_CLIENT_ID);
  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authUrl.searchParams.set("scope", "repo");
  authUrl.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: {
      "Set-Cookie": `__Host-state=${state}; Secure; HttpOnly; SameSite=Lax; Path=/`,
      Location: authUrl.toString(),
    },
  });
};