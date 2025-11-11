// functions/api/callback.js (デバッグ用)
export const onRequestGet = async ({ request, env }) => {
  return new Response("Callback function executed!", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
};