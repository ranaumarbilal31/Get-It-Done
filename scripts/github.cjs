const { spawnSync } = require('node:child_process');
const repository = 'ranaumarbilal31/Get-It-Done';
async function main() {
  const result = spawnSync('git', ['credential', 'fill'], {
    input: 'protocol=https\nhost=github.com\n\n',
    encoding: 'utf8',
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never' },
  });
  const token = result.stdout
    ?.split('\n')
    .find((line) => line.startsWith('password='))
    ?.slice(9)
    .trim();
  if (!token) throw new Error('No GitHub credential available through Git Credential Manager.');
  const api = async (path, method = 'GET', body) => {
    const response = await fetch('https://api.github.com/repos/' + repository + path, {
      method,
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error(`GitHub ${method} ${path}: HTTP ${response.status}`);
    return response.json();
  };
  if (process.argv.includes('--update')) {
    const repo = await api('', 'PATCH', {
      description:
        'A local services marketplace for posting tasks, comparing offers, and collaborating through real-time chat.',
      homepage: 'https://get-it-done-steel.vercel.app',
    });
    const topics = await api('/topics', 'PUT', {
      names: [
        'react',
        'vite',
        'tailwindcss',
        'express',
        'prisma',
        'socketio',
        'marketplace',
        'local-services',
        'technical-seo',
      ],
    });
    console.log(
      JSON.stringify({
        description: repo.description,
        homepage: repo.homepage,
        topics: topics.names,
      }),
    );
  } else {
    const commit = await api('/commits/main');
    const [runs, status, deployments] = await Promise.all([
      api('/actions/runs?per_page=3'),
      api('/commits/' + commit.sha + '/status'),
      api('/deployments?per_page=3'),
    ]);
    console.log(
      JSON.stringify(
        {
          sha: commit.sha,
          runs: runs.workflow_runs.map((r) => ({
            id: r.id,
            status: r.status,
            conclusion: r.conclusion,
            url: r.html_url,
            sha: r.head_sha,
          })),
          status: status.statuses.map((s) => ({
            context: s.context,
            state: s.state,
            url: s.target_url,
          })),
          deployments: deployments.map((d) => ({
            id: d.id,
            environment: d.environment,
            sha: d.sha,
          })),
        },
        null,
        2,
      ),
    );
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
