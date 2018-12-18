import { writeFile, isFile, readFile } from '@sketchmine/node-helpers';
import { getCommits, getVersionTags, GitVersion } from './git';
import { render } from './renderer';
import { transformer } from './transformer';
import { resolve } from 'path';

const LATEST_TAG_REGEX = /## (v[\S]+?)\s/;
const CHANGELOG_FILE = resolve('CHANGELOG.md');

async function main(): Promise<void> {

  const curLog = isFile(CHANGELOG_FILE) ? await readFile(CHANGELOG_FILE) : '';
  const lTag = curLog.match(LATEST_TAG_REGEX);
  const latestTag = lTag ? lTag[1] : null;
  const versions: GitVersion[] = [];
  const tags = await getVersionTags(latestTag);

  for (let i = 0, max = tags.length; i < max; i += 1) {
    if (i === 0) {
      // only get the logs from the beginning if it is a blank new CHANGELOG file
      if (!latestTag) {
        versions.push(await getCommits([tags[i]]));
      }
    } else {
      versions.push(await getCommits([tags[i - 1], tags[i]]));
    }
  }

  const ctx = {
    versions: transformer(versions).reverse(),
    oldChangelog: curLog.replace('# Changelog\n\n\n', ''), // remove old headline
  };

  const result = await render('templates/changelog.hbs', ctx);
  await writeFile(CHANGELOG_FILE, result);
}

main().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
