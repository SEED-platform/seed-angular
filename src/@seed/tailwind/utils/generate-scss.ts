import { mapKeys } from 'lodash-es'
import type { Palette } from '../plugins'

type ColorScale = Palette & {
  contrast: Palette;
}

type ThemeData = {
  'user-themes': {
    default: {
      selector: string;
      primary: ColorScale;
      accent: ColorScale;
      warn: ColorScale;
    };
  };
}

export const generateSCSS = (data: ThemeData) => {
  const getSCSS = (chunk: unknown, level = 0) => {
    const indent = '  '.repeat(level)
    let scss = ''

    if (typeof chunk === 'object' && !Array.isArray(chunk)) {
      mapKeys(chunk, (value, key) => {
        scss += `${indent}${key}: `

        if (typeof value === 'object') {
          if (Array.isArray(value)) {
            scss += '(\n'
            for (const val1 of value) {
              scss += `${indent}${val1 as string},\n`
            }
            scss = `${scss.slice(0, -2)})\n`
          } else {
            scss += `(\n${getSCSS(value, level + 1)},\n${indent})`
          }
        } else {
          scss += getSCSS(value, level + 1)
        }
        scss += ',\n'
      })
      scss = scss.slice(0, -2)
    } else {
      scss += chunk
    }

    return scss
  }

  return `$${getSCSS(data)};\n`
}
