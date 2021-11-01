const {
  DB_USER,
  DB_PASS,
  DB_NAME,
  DB_HOST,
  DB_PORT,
  NODE_ENV,
  API_PUBLIC_HOSTNAME,
  SERVER_PORT,
  SSL_CERTIFICATE_KEY_PATH,
  SSL_CERTIFICATE_CRT_PATH,
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_ALLOW_INVALID_CERTIFICATE,
} = process.env;

export default {
  IS_PRODUCTION: NODE_ENV !== 'development',
  DB_HOST,
  DB_PORT: DB_PORT ? Number.parseInt(DB_PORT) : 5432,
  DB_USER,
  DB_NAME,
  DB_PASS,
  SERVER_PORT: SERVER_PORT ? Number.parseInt(SERVER_PORT) : 3000,
  API_PUBLIC_HOSTNAME: API_PUBLIC_HOSTNAME || '',
  SSL_CERTIFICATE_KEY_PATH: SSL_CERTIFICATE_KEY_PATH || '',
  SSL_CERTIFICATE_CRT_PATH: SSL_CERTIFICATE_CRT_PATH || '',
  EMAIL_HOST,
  EMAIL_PORT: EMAIL_PORT ? Number.parseInt(EMAIL_PORT) : 587,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_ALLOW_INVALID_CERTIFICATE,
};
