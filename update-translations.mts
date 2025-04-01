import fs from 'node:fs/promises'
import path from 'node:path'
import { LokaliseApi } from '@lokalise/node-api'
import decompress from 'decompress'
import ora from 'ora'

const branch = 'angular'
const spinner = ora({
  text: `Fetching translations for the '${branch}' branch...`,
  spinner: {
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    interval: 80,
  },
}).start()

try {
  // Ignore certificate errors on networks with corporate proxies
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

  const lokaliseApi = new LokaliseApi({
    apiKey: process.env.LOKALISE_TOKEN,
    enableCompression: true,
  })

  const {
    items: [{ project_id }],
  } = await lokaliseApi.projects().list()

  const { bundle_url } = await lokaliseApi.files().download(`${project_id}:${branch}`, {
    add_newline_eof: true,
    format: 'json',
    indentation: '2sp',
    original_filenames: false,
  })

  const zipResponse = await fetch(bundle_url)

  const i18nDir = 'public/i18n'
  await decompress(Buffer.from(await zipResponse.arrayBuffer()), i18nDir, { strip: 1 })

  // Fix UTC modified timestamps
  const now = new Date()
  const files = await fs.readdir(i18nDir)
  await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(i18nDir, file)
      await fs.utimes(filePath, now, now)
    }),
  )

  spinner.succeed('Translations updated')
} catch (err) {
  spinner.fail('Failed to update translations')
  console.error(err)
}
