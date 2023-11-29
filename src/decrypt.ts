import * as core from '@actions/core'

import {DecryptCommand, KMSClient} from '@aws-sdk/client-kms'
import {readFileSync, readdirSync, writeFileSync} from 'fs'

import crypto from 'crypto'

const client = new KMSClient()

export async function decryptFiles(filePath: string): Promise<void> {
  const files = readdirSync(filePath, {withFileTypes: true})

  for (const [file, encryptedKey] of files
    .filter(file => file.isFile())
    .map(
      file =>
        [`${filePath}/${file.name}`, `${filePath}/${file.name}.key`] as const
    )) {
    core.info(`Decrypting ${file}`)
    const encrytedKeyBuffer = readFileSync(encryptedKey)
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
    const decrypted = Buffer.concat([
      decipher.update(readFileSync(file)),
      decipher.final()
    ])

    writeFileSync(file, decrypted)
    core.info('File decrypted successfully')
  }
}
