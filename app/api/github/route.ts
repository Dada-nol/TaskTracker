import { NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME!;

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      date: string;
    };
  };
  repository?: {
    name: string;
    full_name: string;
  };
}

interface CommitByDate {
  date: string;
  commits: {
    sha: string;
    message: string;
    repo: string;
    time: string;
  }[];
}

export async function GET() {
  try {
    const headers = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    // Récupérer tous les repos
    const reposRes = await fetch(
      `https://api.github.com/user/repos?per_page=100&sort=pushed&type=owner`,
      { headers },
    );
    const repos = await reposRes.json();

    if (!Array.isArray(repos)) {
      return NextResponse.json(
        { error: "Impossible de récupérer les repos" },
        { status: 500 },
      );
    }

    // Date de début : 30 jours en arrière
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceStr = since.toISOString();

    // Récupérer les commits sur tous les repos en parallèle
    const allCommits: {
      sha: string;
      message: string;
      repo: string;
      date: string;
      time: string;
    }[] = [];

    await Promise.all(
      repos.map(async (repo: any) => {
        try {
          const commitsRes = await fetch(
            `https://api.github.com/repos/${repo.full_name}/commits?author=${GITHUB_USERNAME}&since=${sinceStr}&per_page=100`,
            { headers },
          );
          if (!commitsRes.ok) return;
          const commits = await commitsRes.json();
          if (!Array.isArray(commits)) return;

          commits.forEach((c: GitHubCommit) => {
            allCommits.push({
              sha: c.sha,
              message: c.commit.message.split("\n")[0], // première ligne seulement
              repo: repo.name,
              date: c.commit.author.date.slice(0, 10),
              time: c.commit.author.date,
            });
          });
        } catch {
          // repo inaccessible, on skip
        }
      }),
    );

    // Grouper par date
    const byDate = allCommits.reduce(
      (acc: Record<string, typeof allCommits>, commit) => {
        if (!acc[commit.date]) acc[commit.date] = [];
        acc[commit.date].push(commit);
        return acc;
      },
      {},
    );

    // Trier les dates et les commits
    const result: CommitByDate[] = Object.entries(byDate)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, commits]) => ({
        date,
        commits: commits.sort((a, b) => b.time.localeCompare(a.time)),
      }));

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
