module.exports = {
  // this will check Typescript files
  '**/*.(ts|tsx)': () => 'yarn tsc --noEmit',

  // This will lint and format TypeScript and JavaScript files
  '**/*.(ts|tsx|js|jsx)': (filenames) => [
    `yarn eslint --fix ${filenames.map((file) => `"${file}"`).join(' ')}`,
    `yarn prettier --write ${filenames.map((file) => `"${file}"`).join(' ')}`,
  ],

  // this will Format MarkDown and JSON
  '**/*.(md|json)': (filenames) =>
    `yarn prettier --write ${filenames.map((file) => `"${file}"`).join(' ')}`,

  // check solidity smart contracts
  '**/*.sol': (filenames) => `yarn solhint ${filenames.map((file) => `"${file}"`).join(' ')}`,
};
