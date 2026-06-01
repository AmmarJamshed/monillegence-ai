export const GITHUB_REPO = 'AmmarJamshed/monillegence-ai';
export const GITHUB_URL = `https://github.com/${GITHUB_REPO}`;
export const RELEASE_TAG = 'v0.1.0';

const RAW = `https://raw.githubusercontent.com/${GITHUB_REPO}/main`;

export const DOWNLOADS = {
  /** One-click installer — run this file, everything else is automatic */
  installWindows: `${RAW}/scripts/install-and-run-windows.bat`,
  installMac: `${RAW}/scripts/install-and-run-mac.sh`,
  startWindows: `${RAW}/scripts/start-monillegence.bat`,
  softwareZip: `https://github.com/${GITHUB_REPO}/archive/refs/tags/${RELEASE_TAG}.zip`,
  ollama: 'https://ollama.com/download',
  nodejs: 'https://nodejs.org/',
} as const;

export const OLLAMA_HOST = 'http://127.0.0.1:11434';
