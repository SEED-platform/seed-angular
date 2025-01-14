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
  const getSCSS = (chunk: unknown) => {
    let scss = ''

    if (typeof chunk === 'object' && !Array.isArray(chunk)) {
      mapKeys(chunk, (value, key) => {
        scss += `${key}: `

        if (typeof value === 'object') {
          if (Array.isArray(value)) {
            scss += '('
            for (const val1 of value) {
              if (Array.isArray(val1)) {
                for (const val2 of val1) {
                  scss += `${val2 as string} `
                }
                scss = `${scss.slice(0, -1)}, `
              } else {
                scss += `${val1 as string}, `
              }
            }
            scss = scss.slice(0, -2)
            scss += ')'
          } else {
            scss += `(${getSCSS(value)})`
          }
        } else {
          scss += getSCSS(value)
        }
        scss += ', '
      })
      scss = scss.slice(0, -2)
    } else {
      scss += chunk
    }

    return scss
  }

  return `$${getSCSS(data)};`
}
