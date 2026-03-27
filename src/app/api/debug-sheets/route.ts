import { NextResponse } from 'next/server'

export async function GET() {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_B64 ?? ''
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? ''
  const spreadId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? ''

  let decoded = ''
  let decodeError = ''
  try {
    decoded = Buffer.from(b64, 'base64').toString('utf-8')
  } catch (e) {
    decodeError = String(e)
  }

  return NextResponse.json({
    hasB64: b64.length > 0,
    b64Length: b64.length,
    hasEmail: email.length > 0,
    email: JSON.stringify(email),
    hasSpreadId: spreadId.length > 0,
    spreadId: JSON.stringify(spreadId),
    spreadIdLength: spreadId.length,
    decodedStarts: decoded.slice(0, 40),
    decodedEnds: decoded.slice(-30),
    decodedLength: decoded.length,
    decodeError,
  })
}
