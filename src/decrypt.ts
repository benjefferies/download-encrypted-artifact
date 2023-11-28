import * as core from '@actions/core'

import {
  CommitmentPolicy,
  KmsKeyringNode,
  buildDecrypt
} from '@aws-crypto/client-node'
import {readFileSync, readdirSync, writeFileSync} from 'fs'

export async function decryptFiles(
  filePath: string,
  kmsKeyId: string
): Promise<void> {
  const keyring = new KmsKeyringNode({generatorKeyId: kmsKeyId})

  const client = buildDecrypt(CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT)

  const files = readdirSync(filePath, {withFileTypes: true})

  for (const file of files.filter(file => file.isFile())) {
    core.info(`Decrypting ${filePath}/${file.name}`)
    const fileBuffer = readFileSync(`${filePath}/${file.name}`)
    const {plaintext} = await client.decrypt(keyring, fileBuffer)
    writeFileSync(`${filePath}/${file.name}`, plaintext)
    core.info('File decrypted successfully')
  }
}
