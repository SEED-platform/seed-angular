import { enc, SHA256 } from 'crypto-js'

export const sha256 = (text: string) => SHA256(text).toString(enc.Hex)
