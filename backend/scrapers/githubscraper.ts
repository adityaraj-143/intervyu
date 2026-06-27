import axios from "axios";

export async function githubScraper(username: string) {
  const response = await axios.get(
    `https://api.github.com/users/${username}/repos`,
    {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
      },
    },
  );

  return response.data.map((repo: any) => ({
    name: repo.name,
    description: repo.description,
    fullName: repo.full_name,
    starCount: repo.stargazers_count,
  }));
}
