import { executeCommand as exec } from '@sketchmine/node-helpers';
import { GitVersion, GitCommit } from './git.interface';

const commitProperties = {
  hash: '%H',
  abbrevHash: '%h',
  authorName: '%an',
  authorEmail: '%ae',
  authorDate: '%ai',
  authorDateRel: '%ar',
  committerName: '%cn',
  committerEmail: '%ce',
  committerDate: '%cd',
  committerDateRel: '%cr',
  subject: '%s',
  body: '%b',
};

export async function getCommits(startToEnd: string[] = ['HEAD']): Promise<GitVersion> {
  const format = JSON.stringify(commitProperties);
  const pretty = ` --pretty="format:${format.replace(/\"/g, '\\"')},"`;

  const fromTo = startToEnd.length > 1 ? startToEnd.join('..') : startToEnd[0];

  const cmd = `git log ${fromTo}${pretty}`;

  const gitLog = await exec(cmd);
  const parsed = gitLog
    .replace(/[\r?\n](?!\{)/g, '\/n') // replace newlines in commit messages with placeholder
    .slice(0, -1); // remove the last comma

  return {
    version: startToEnd.pop(),
    commits: JSON.parse(`[${parsed}]`) as GitCommit[],
  };
}
