# task-cli

Node.js answer of [Task Tracker](https://roadmap.sh/projects/task-tracker) Project.

## Usage

```
# Adding a new task
npx tsx ./main.ts add "Buy groceries"

# Updating and deleting
npx tsx ./main.ts update 1 "Buy groceries and cook dinner"
npx tsx ./main.ts delete 1

# Marking a task as in progress or done
npx tsx ./main.ts mark-in-progress 1
npx tsx ./main.ts mark-done 1

# Listing all tasks
npx tsx ./main.ts list

# Listing tasks by status
npx tsx ./main.ts list done
npx tsx ./main.ts list todo
npx tsx ./main.ts list in-progress
```

## Test

```
npm run test
npm run test:watch
```
