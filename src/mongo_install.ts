import {downloadAndExtractMongoDB} from './download';
import {getDistro, getUbuntuVersion} from './utils';

const platform = process.platform;
const arch = process.arch;

let mongodbVersion: string;

let extension: string = 'tgz';

let mongodbUrl: string;

if (platform === 'win32') {
  if (arch === 'x64') {
    extension = 'zip';
    mongodbVersion = 'mongodb-windows-x64';
    mongodbUrl = 'https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-6.0.5.zip';
  } else {
    // 其他架构
  }
} else if (platform === 'darwin') {
  if (arch === 'x64') {
    mongodbVersion = 'mongodb-macos-intel';
    mongodbUrl = 'https://example.com/path/to/mongodb-macos-intel.tar.gz';
  } else if (arch === 'arm64') {
    mongodbVersion = 'mongodb-macos-apple';
    mongodbUrl = 'https://example.com/path/to/mongodb-macos-apple.tar.gz';
  }
} else if (platform === 'linux') {
  const distro = getDistro();
  if (distro === 'WSL') {
    mongodbVersion = 'mongodb-wsl';
    mongodbUrl = 'https://example.com/path/to/mongodb-wsl.tar.gz';
  } else if (distro === 'Ubuntu') {
    const ubuntuVersion = getUbuntuVersion();
    mongodbVersion = `mongodb-ubuntu-${ubuntuVersion}`;
    mongodbUrl = `https://example.com/path/to/mongodb-ubuntu-${ubuntuVersion}.tar.gz`;
  } else if (distro === 'CentOS') {
    mongodbVersion = 'mongodb-centos';
    mongodbUrl = 'https://example.com/path/to/mongodb-centos.tar.gz';
  }
}

// @ts-ignore
if (mongodbVersion && mongodbUrl) {
  downloadAndExtractMongoDB(mongodbVersion, mongodbUrl, extension);
} else {
  console.error('Unsupported platform or architecture');
}
