import { Hex } from 'crypto-es/lib/core'
import { SHA256 } from 'crypto-es/lib/sha256'

export const sha256 = (text: string) => SHA256(text).toString(Hex)
