export function buildDatabaseUrl(
  env: NodeJS.ProcessEnv = process.env,
): string {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }

  const host = env.DB_HOST;
  const port = env.DB_PORT ?? "5432";
  const name = env.DB_NAME;
  const user = env.DB_USER;
  const password = env.DB_PASS ?? "";

  if (!host || !name || !user) {
    throw new Error("Defina DB_HOST, DB_NAME e DB_USER no .env");
  }

  const auth = `${encodeURIComponent(user)}:${encodeURIComponent(password)}`;
  return `postgresql://${auth}@${host}:${port}/${name}?schema=public`;
}

export function ensureDatabaseUrl(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const url = buildDatabaseUrl(env);
  env.DATABASE_URL = url;
  return url;
}
