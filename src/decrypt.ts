import * as core from '@actions/core'

import {DecryptCommand, KMSClient} from '@aws-sdk/client-kms'
import {readFileSync, readdirSync, writeFileSync} from 'fs'

const client = new KMSClient()

export async function decryptFiles(
  filePath: string,
  kmsKeyId: string
): Promise<void> {
  const files = readdirSync(filePath, {withFileTypes: true})

  for (const file of files.filter(file => file.isFile())) {
    core.info(`Decrypting ${filePath}/${file.name}`)
    const fileBuffer = readFileSync(`${filePath}/${file.name}`)
    const command = new DecryptCommand({
      KeyId: kmsKeyId,
      CiphertextBlob: fileBuffer,
      EncryptionAlgorithm: 'SYMMETRIC_DEFAULT'
    })
    const {Plaintext} = await client.send(command)
    writeFileSync(`${filePath}/${file.name}`, Plaintext)
    core.info('File decrypted successfully')
  }
}
