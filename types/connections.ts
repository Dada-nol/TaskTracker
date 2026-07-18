export interface GitHubCommitEntry {
  sha: string;
  message: string;
  repo: string;
  date: string;
  time: string;
}

export interface GitHubActivity {
  date: string;
  commits: GitHubCommitEntry[];
}
