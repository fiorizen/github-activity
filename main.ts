#!/usr/bin/env node

function showUsage() {
  console.log("Usage:");
  console.log("  <username> - Show Github activity of user");
}

const API_URL = "https://api.github.com/users";

function handleError(error?: unknown) {
  if (!error || !(error instanceof Error)) return;
  if (error.message) {
    console.error(error.message);
  } else {
    console.error(`Unknown error is occurred.`);
  }
}

/**
 * request API with given username
 */
export async function getGithubUserActivity(username: string) {
  const url = `${API_URL}/${username}/events`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    handleError(error);
  }
}

/**
 * Show Github activity data with console.log
 */
export function showGithubActivity(activity: Activity) {
  if (!activity.length) {
    console.log("No recent activity found.");
    return;
  }

  activity.forEach((event: Event) => {
    let action = "";
    switch (event.type) {
      case "PushEvent": {
        const count = event.payload.commits?.length ?? 0;
        action = `Pushed ${count} commit(s) to ${event.repo.name}`;
        break;
      }
      case "CreateEvent": {
        action = `Created ${event.payload.ref_type} in ${event.repo.name}`;
        break;
      }
      default: {
        return;
      }
    }
    console.log(`- ${action}`);
  });
}

/**
 * 1. Parse CLI args
 * 2. Request API with given username
 * 3. Console result or Error message.
 */
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || ["-h", "--help"].includes(args?.[0])) {
    showUsage();
    return;
  }
  const username = args[0];
  const activity = await getGithubUserActivity(username);
  if (!activity) {
    console.log("User not found");
    return;
  }
  showGithubActivity(activity);

  try {
    if (!username) {
      showUsage();
      return;
    }
  } catch (error) {
    handleError(error);
    process.exit(1);
  }
}

main();
