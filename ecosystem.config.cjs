module.exports = {
    apps: [
        {
            name: "marketing-email",
            script: "./backend-email/server.js",
            watch: ["./backend-email"],
            ignore_watch: ["node_modules", "logs"],
            env: {
                PORT: 3050,
                NODE_ENV: "production",
            }
        },
        {
            name: "wa-gateway",
            script: "./backend-wa/whatsapp.js",
            watch: ["./backend-wa"],
            ignore_watch: ["node_modules", "logs"],
            env: {
                PORT: 3051,
                NODE_ENV: "production",
            }
        }
    ]
};
