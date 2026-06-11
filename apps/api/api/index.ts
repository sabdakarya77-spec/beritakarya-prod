/**
 * Vercel Serverless Function Entrypoint
 *
 * Vercel akan memuat file ini sebagai Handler untuk setiap request ke /api/*.
 * File ini cukup mengimpor dan mengekspor instance Express `app` dari main.ts.
 *
 * Referensi: https://vercel.com/docs/frameworks/express
 */
import '../src/main'
export { app as default } from '../src/main'
