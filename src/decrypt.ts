import * as core from '@actions/core'

import {DecryptCommand, KMSClient} from '@aws-sdk/client-kms'
import {readFileSync, readdirSync, writeFileSync} from 'fs'

import crypto from 'crypto'

const client = new KMSClient()

export async function decryptFiles(filePath: string): Promise<void> {
  const files = readdirSync(filePath, {withFileTypes: true})

  for (const file of files
    .filter(file => file.isFile())
    .filter(file => !file.name.endsWith('.key'))) {
    core.info(`Decrypting ${file}`)
    const encrytedKeyBuffer = readFileSync(`${file}.key`)
    const command = new DecryptCommand({
      CiphertextBlob: encrytedKeyBuffer
    })
    core.debug('Decrypting encryption key')
    const {Plaintext} = await client.send(command)
    if (!Plaintext) {
      throw new Error('Encryption key could not be decrypted')
    }
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Plaintext,
      crypto.randomBytes(16)
    )
    core.debug('Decrypting file')
    const fullPath = `${filePath}/${file}`
    const decrypted = Buffer.concat([
      decipher.update(readFileSync(fullPath)),
      decipher.final()
    ])

    writeFileSync(fullPath, decrypted)
    core.info('File decrypted successfully')
  }
}
