import * as Sentry from '@sentry/tanstackstart-react'

const dsn = process.env.SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    // Adds request headers and IP for users
    sendDefaultPii: true,
    // Enable logs to be sent to Sentry (optional)
    enableLogs: true,
    environment: process.env.NODE_ENV || 'development',
  })
}
