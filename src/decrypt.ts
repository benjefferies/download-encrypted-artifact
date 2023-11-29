import * as core from '@actions/core'

import {DecryptCommand, KMSClient} from '@aws-sdk/client-kms'
import {readFileSync, readdirSync, statSync, writeFileSync} from 'fs'

import crypto from 'crypto'
import path from 'path'

const client = new KMSClient()

function getAllFiles(dirPath: string, arrayOfFiles?: string[]) {
  const files = readdirSync(dirPath)

  arrayOfFiles = arrayOfFiles || []

  files.forEach(function (file) {
    if (statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles)
    } else {
      arrayOfFiles?.push(path.join(dirPath, '/', file))
    }
  })

  return arrayOfFiles
}

export async function decryptFiles(filePath: string): Promise<void> {
  const allFiles = getAllFiles(filePath)

  for (const file of allFiles.filter(
    file => !file.endsWith('.key') && !file.endsWith('.iv')
  )) {
    core.info(`Decrypting file: ${file}`)
    const encrytedKeyBuffer = readFileSync(`${file}.key`)
    const command = new DecryptCommand({
      CiphertextBlob: encrytedKeyBuffer
    })
    core.debug('Decrypting encryption key')
    const {Plaintext} = await client.send(command)
    if (!Plaintext) {
      throw new Error('Encryption key could not be decrypted')
    }
    const iv = readFileSync(`${file}.iv`)
    const decipher = crypto.createDecipheriv('aes-256-cbc', Plaintext, iv)
    core.debug('Decrypting file')
    const decrypted = Buffer.concat([
      decipher.update(readFileSync(file)),
      decipher.final()
    ])

    writeFileSync(file, decrypted)
    core.info('File decrypted successfully')
  }
}
