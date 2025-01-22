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

  await decompress(Buffer.from(await zipResponse.arrayBuffer()), 'public/i18n', { strip: 1 })

  spinner.succeed('Translations updated')
} catch (err) {
  spinner.fail('Failed to update translations')
  console.error(err)
}
