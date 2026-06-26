import midtransClient from 'midtrans-client'
import crypto from 'crypto'

// ─── Midtrans Snap Service ───────────────────────────────────────────────────
// Integrasi Midtrans Snap untuk pembayaran iklan.
// Dokumentasi: https://snap-docs.midtrans.com/

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || ''
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || ''
const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSnap(): any {
  return new midtransClient.Snap({
    isProduction: IS_PRODUCTION,
    serverKey: MIDTRANS_SERVER_KEY,
    clientKey: MIDTRANS_CLIENT_KEY,
  })
}

/**
 * Buat Snap transaction untuk booking iklan.
 * Return snap_token yang dipakai frontend untuk buka popup.
 */
export async function createSnapTransaction(params: {
  orderId: string
  grossAmount: number
  customerName: string
  customerEmail: string
  itemDetails: { id: string; name: string; price: number; quantity: number }[]
}): Promise<{ token: string; redirect_url: string }> {
  const snap = getSnap()

  const transactionDetails = {
    order_id: params.orderId,
    gross_amount: params.grossAmount,
  }

  const customerDetails = {
    first_name: params.customerName,
    email: params.customerEmail,
  }

  const parameter = {
    transaction_details: transactionDetails,
    customer_details: customerDetails,
    item_details: params.itemDetails,
    credit_card: {
      secure: true,
    },
  }

  const transaction = await snap.createTransaction(parameter)
  return {
    token: transaction.token,
    redirect_url: transaction.redirect_url,
  }
}

/**
 * Verifikasi notifikasi dari Midtrans webhook.
 * Return status pembayaran.
 */
export function verifyMidtransSignature(params: {
  order_id: string
  status_code: string
  gross_amount: string
  signature_key: string
}): boolean {
  const hash = crypto
    .createHash('sha512')
    .update(params.order_id + params.status_code + params.gross_amount + MIDTRANS_SERVER_KEY)
    .digest('hex')
  return hash === params.signature_key
}

/**
 * Map transaction_status Midtrans ke status booking kita.
 */
export function mapMidtransStatus(
  transactionStatus: string,
  fraudStatus?: string
): { paymentStatus: 'PAID' | 'REJECTED' | 'PENDING'; shouldActivate: boolean } {
  // Capture: pembayaran kartu kredit berhasil
  if (transactionStatus === 'capture') {
    if (fraudStatus === 'accept') {
      return { paymentStatus: 'PAID', shouldActivate: true }
    }
    return { paymentStatus: 'REJECTED', shouldActivate: false }
  }

  // Settlement: pembayaran non-kartu berhasil (VA, e-wallet, QRIS)
  if (transactionStatus === 'settlement') {
    return { paymentStatus: 'PAID', shouldActivate: true }
  }

  // Deny: pembayaran ditolak
  if (transactionStatus === 'deny') {
    return { paymentStatus: 'REJECTED', shouldActivate: false }
  }

  // Cancel: pembayaran dibatalkan
  if (transactionStatus === 'cancel') {
    return { paymentStatus: 'REJECTED', shouldActivate: false }
  }

  // Expire: pembayaran kedaluwarsa
  if (transactionStatus === 'expire') {
    return { paymentStatus: 'REJECTED', shouldActivate: false }
  }

  // Pending: menunggu pembayaran
  return { paymentStatus: 'PENDING', shouldActivate: false }
}
