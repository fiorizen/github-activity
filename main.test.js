import fetchMock from "fetch-mock";
import { fs as mfs } from "memfs";
import { strict as assert } from "node:assert";
import fs from "node:fs";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import sinon from "sinon";
import { getGithubUserActivity, showGithubActivity } from "./main.js";

// テスト中は実際のファイルは触らない
mock.method(fs, "readFileSync", mfs.readFileSync);
mock.method(fs, "writeFileSync", mfs.writeFileSync);

const startTime = "2024-01-02T11:01:58.135Z";

beforeEach(() => {
  mock.timers.enable({
    apis: ["Date"],
    now: new Date(startTime),
  });
});
afterEach(() => {
  mock.timers.reset();
});

describe("getGithubUserActivity", () => {
  const username = "octocat";
  const mockResponse = [
    {
      id: "1234567890",
      type: "PushEvent",
      actor: {
        id: 1,
        login: "octocat",
        display_login: "octocat",
        gravatar_id: "",
        url: "https://api.github.com/users/octocat",
        avatar_url: "https://github.com/images/error/octocat_happy.gif",
      },
      repo: {
        id: 123456,
        name: "octocat/Hello-World",
        url: "https://api.github.com/repos/octocat/Hello-World",
      },
      payload: {
        push_id: 1234567890,
        size: 1,
        distinct_size: 1,
        ref: "refs/heads/main",
        head: "abc123",
        before: "def456",
        commits: [
          {
            sha: "abc123",
            author: {
              email: "octocat@github.com",
              name: "The Octocat",
            },
            message: "Fix all the bugs",
            distinct: true,
            url: "https://api.github.com/repos/octocat/Hello-World/commits/abc123",
          },
        ],
      },
      public: true,
      created_at: "2023-10-01T12:34:56Z",
    },
  ];
  beforeEach(() => {
    fetchMock.get("https://api.github.com/users/octocat/events", mockResponse);
  });
  afterEach(() => {
    fetchMock.reset();
  });
  it("Happy: should return user activity", async () => {
    const result = await getGithubUserActivity(username);
    assert.deepEqual(result, mockResponse);
  });
});

describe("showGithubActivity", () => {
  let consoleLogStub;
  beforeEach(() => {
    consoleLogStub = sinon.stub(console, "log");
  });
  afterEach(() => {
    consoleLogStub.restore();
  });

  it('Happy: should log "No recent activity found." when activity is empty', () => {
    showGithubActivity([]);
    assert(consoleLogStub.calledOnceWith("No recent activity found."));
  });

  it("Happy: should log push event activity", () => {
    const activity = [
      {
        type: "PushEvent",
        payload: {
          commits: [{}, {}],
        },
        repo: {
          name: "octocat/Hello-World",
        },
      },
    ];
    showGithubActivity(activity);
    assert(
      consoleLogStub.calledOnceWith(
        "- Pushed 2 commit(s) to octocat/Hello-World"
      )
    );
  });

  it("should log create event activity", () => {
    const activity = [
      {
        type: "CreateEvent",
        payload: {
          ref_type: "repository",
        },
        repo: {
          name: "octocat/Hello-World",
        },
      },
    ];
    showGithubActivity(activity);
    assert(
      consoleLogStub.calledOnceWith(
        "- Created repository in octocat/Hello-World"
      )
    );
  });

  it("Sad: should not log for unsupported event types", () => {
    const activity = [
      {
        type: "DeleteEvent",
        payload: {},
        repo: {
          name: "octocat/Hello-World",
        },
      },
    ];
    showGithubActivity(activity);
    assert(consoleLogStub.notCalled);
  });
});
