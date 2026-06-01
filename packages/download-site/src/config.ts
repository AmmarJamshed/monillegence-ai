export const GITHUB_REPO = 'AmmarJamshed/monillegence-ai';
export const GITHUB_URL = `https://github.com/${GITHUB_REPO}`;
export const RELEASE_TAG = 'v0.1.0';

export const DOWNLOADS = {
  softwareZip: `https://github.com/${GITHUB_REPO}/archive/refs/tags/${RELEASE_TAG}.zip`,
  softwareZipLatest: `https://github.com/${GITHUB_REPO}/archive/refs/heads/main.zip`,
  setupWindowsBat: `https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/setup-windows.bat`,
  installMd: `https://raw.githubusercontent.com/${GITHUB_REPO}/main/INSTALL.md`,
  ollama: 'https://ollama.com/download',
  nodejs: 'https://nodejs.org/',
} as const;

export const OLLAMA_HOST = 'http://127.0.0.1:11434';
