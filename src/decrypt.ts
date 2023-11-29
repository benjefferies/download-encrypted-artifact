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
    const fullPath = `${filePath}/${file.name}`
    core.info(`Decrypting file: ${fullPath}`)
    const encrytedKeyBuffer = readFileSync(`${fullPath}.key`)
    const command = new DecryptCommand({
      CiphertextBlob: encrytedKeyBuffer
    })
    core.debug('Decrypting encryption key')
    const {Plaintext} = await client.send(command)
    if (!Plaintext) {
      throw new Error('Encryption key could not be decrypted')
    }
    const iv = readFileSync(`${fullPath}.iv`)
    const decipher = crypto.createDecipheriv('aes-256-gcm', Plaintext, iv)
    core.debug('Decrypting file')
    const decrypted = Buffer.concat([
      decipher.update(readFileSync(fullPath)),
      decipher.final()
    ])

    writeFileSync(fullPath, decrypted)
    core.info('File decrypted successfully')
  }
}
