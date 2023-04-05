import fs from 'fs';
import path from "path";

function getDistro(): string | undefined {
  const distro = fs.readFileSync('/etc/os-release', 'utf8');
  if (distro.includes('Ubuntu')) {
    return 'Ubuntu';
  } else if (distro.includes('CentOS')) {
    return 'CentOS';
  } else if (distro.includes('Microsoft')) {
    return 'WSL';
  }
}

function getUbuntuVersion(): string | null {
  const release = fs.readFileSync('/etc/lsb-release', 'utf8');
  const match = release.match(/DISTRIB_RELEASE=(\d+\.\d+)/);
  return match ? match[1] : null;
}

async function displayExtractedFiles(directory: string): Promise<string | null> {
  return new Promise((res, rej) => {
    fs.readdir(directory, (err, files) => {
      res(path.join(directory, files[0]) || null)
    })
  })
}

// @ts-ignore
const packagePath = path.dirname(require.main.filename);

export {
  getDistro,
  getUbuntuVersion,
  displayExtractedFiles,
  packagePath
};
