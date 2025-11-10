// functions/api/auth.js (一時的なデバッグコード)

export const onRequestGet = async ({ request, env }) => {
    // 取得したクライアントIDの値を直接表示する
    const clientId = env.GITHUB_CLIENT_ID || "--- CLIENT_ID NOT FOUND ---";
    const secretStatus = env.GITHUB_CLIENT_SECRET ? "SECRET IS LOADED" : "SECRET IS MISSING";

    // GitHubへリダイレクトせずに、情報をブラウザに返す
    return new Response(
        `
        <h1>OAuth Debug Info (Temporary)</h1>
        <p>Client ID: <strong>${clientId}</strong></p>
        <p>Client Secret Status: <strong>${secretStatus}</strong></p>
        `,
        {
            status: 200,
            headers: { "Content-Type": "text/html" }
        }
    );
};