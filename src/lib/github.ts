/**
 * Fetches the number of public repositories for a given GitHub username.
 */
export async function fetchGithubRepoCount(username: string): Promise<number> {
  if (!username) return 0;
  
  try {
    // Try to get user profile first
    const userResponse = await fetch(`https://api.github.com/users/${username}`);
    if (!userResponse.ok) {
      if (userResponse.status === 404) {
        throw new Error('GitHub user not found');
      }
      throw new Error('Failed to fetch GitHub data');
    }
    
    const userData = await userResponse.json();
    const publicRepos = userData.public_repos || 0;

    // If public_repos is 0, double check with the repos endpoint just in case
    if (publicRepos === 0) {
      const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
      if (reposResponse.ok) {
        const reposData = await reposResponse.json();
        return reposData.length || 0;
      }
    }
    
    return publicRepos;
  } catch (error) {
    console.error('Error fetching GitHub repo count:', error);
    // Return 0 instead of throwing to avoid breaking the UI, but log it
    return 0;
  }
}
