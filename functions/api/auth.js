---
import { v4 as uuid } from "uuid";

export const onRequest: PagesFunction = async ({ request, env, next }) => {
  const state = uuid();
  const url = new URL("https://github.com/login/oauth/authorize");

  url.searchParams.set("client_id", env.GITHUB_CLIENT_ID as string);
  url.searchParams.set("scope", "repo");
  url.searchParams.set("state", state);

  const response = new Response(null, {
    status: 302,
    headers: {
      location: url.toString(),
      "Set-Cookie": `state=${state}; HttpOnly; Path=/; Max-Age=600`,
    },
  });

  return response;
};
