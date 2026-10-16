/** @type {import('next').NextConfig} */
const requiredEnvironmentVariables = [
  'NEXT_PUBLIC_APP_URL',
  'DB_URL',
  'DB_NAME',
  'CLOUDINARY_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
]

const missingEnvironmentVariables = requiredEnvironmentVariables.filter(
  (name) => !process.env[name]?.trim()
)

if (missingEnvironmentVariables.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvironmentVariables.join(', ')}. ` +
      'Copy .env.example to .env and provide values before starting the app.'
  )
}

const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
