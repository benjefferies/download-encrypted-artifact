# Download-Artifact v1

This downloads encrypted artifacts from your build and decrypts them using KMS.

See also [upload-encrypted-artifact](https://github.com/actions/upload-artifact).

# Usage

See [action.yml](action.yml)

# Download a Single Artifact

Basic (download to the current working directory):
```yaml
steps:
- uses: actions/checkout@v3

- uses: benjefferies/download-encrypted-artifact@v1
  with:
    name: my-artifact
    kms-key-id: ${{ secrets.KMS_KEY_ID }}
    
- name: Display structure of downloaded files
  run: ls -R
```

Download to a specific directory:
```yaml
steps:
- uses: actions/checkout@v3

- uses: benjefferies/download-encrypted-artifact@v1
  with:
    name: my-artifact
    path: path/to/artifact
    kms-key-id: ${{ secrets.KMS_KEY_ID }}
    
- name: Display structure of downloaded files
  run: ls -R
  working-directory: path/to/artifact
```

Basic tilde expansion is supported for the `path` input:
```yaml
  - uses: benjefferies/download-encrypted-artifact@v1
    with:
      name: my-artifact
      path: ~/download/path
      kms-key-id: ${{ secrets.KMS_KEY_ID }}
```

# Download All Artifacts

If the `name` input parameter is not provided, all artifacts will be downloaded. **To differentiate between downloaded artifacts, a directory denoted by the artifacts name will be created for each individual artifact.**
Example, if there are two artifacts `Artifact-A` and `Artifact-B`, and the directory is `etc/usr/artifacts/`, the directory structure will look like this:
```
  etc/usr/artifacts/
      Artifact-A/
          ... contents of Artifact-A
      Artifact-B/
          ... contents of Artifact-B
```

Download all artifacts to a specific directory
```yaml
steps:
- uses: actions/checkout@v3

- uses: benjefferies/download-encrypted-artifact@v1
  with:
    path: path/to/artifacts
    kms-key-id: ${{ secrets.KMS_KEY_ID }}
    
- name: Display structure of downloaded files
  run: ls -R
  working-directory: path/to/artifacts
```

Download all artifacts to the current working directory
```yaml
steps:
- uses: actions/checkout@v3

- uses: benjefferies/download-encrypted-artifact@v1
  with:
    kms-key-id: ${{ secrets.KMS_KEY_ID }}

- name: Display structure of downloaded files
  run: ls -R
```

# Download path output

The `download-path` step output contains information regarding where the artifact was downloaded to. This output can be used for a variety of purposes such as logging or as input to other actions. Be aware of the extra directory that is created if downloading all artifacts (no name specified).

```yaml
steps:
- uses: actions/checkout@v3

- uses: benjefferies/download-encrypted-artifact@v1
  id: download
  with:
    name: 'my-artifact'
    path: path/to/artifacts
    kms-key-id: ${{ secrets.KMS_KEY_ID }}

- name: 'Echo download path'
  run: echo ${{steps.download.outputs.download-path}}
```

> Note: The `id` defined in the `download/artifact` step must match the `id` defined in the `echo` step (i.e `steps.[ID].outputs.download-path`)

# Limitations

### Permission Loss

:exclamation: File permissions are not maintained during artifact upload :exclamation: For example, if you make a file executable using `chmod` and then upload that file, post-download the file is no longer guaranteed to be set as an executable.

### Case Insensitive Uploads

:exclamation: File uploads are case insensitive :exclamation: If you upload `A.txt` and `a.txt` with the same root path, only a single file will be saved and available during download.

### Maintaining file permissions and case sensitive files

If file permissions and case sensitivity are required, you can `tar` all of your files together before artifact upload. Post download, the `tar` file will maintain file permissions and case sensitivity.

```yaml
  - name: 'Tar files'
    run: tar -cvf my_files.tar /path/to/my/directory

  - name: 'Upload Artifact'
    uses: benjefferies/upload-encrypted-artifact@v1
    with:
      name: my-artifact
      path: my_files.tar    
```

# @actions/artifact package

Internally the [@actions/artifact](https://github.com/actions/toolkit/tree/main/packages/artifact) NPM package is used to interact with artifacts. You can find additional documentation there along with all the source code related to artifact download.

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
