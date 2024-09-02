# task-cli

Node.js answer of [Task Tracker](https://roadmap.sh/projects/task-tracker) Project.

## Usage

```
# Adding a new task
./main.js add "Buy groceries"

# Updating and deleting
./main.js update 1 "Buy groceries and cook dinner"
./main.js delete 1

# Marking a task as in progress or done
./main.js mark-in-progress 1
./main.js mark-done 1

# Listing all tasks
./main.js list

# Listing tasks by status
./main.js list done
./main.js list todo
./main.js list in-progress
```

## Test

```
npm run test
npm run test:watch
```
