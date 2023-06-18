export default () => ({
  PORT: parseInt(process.env.PORT, 10) || 3028,
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URI: process.env.DATABASE_URI,
});
