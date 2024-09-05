#!/usr/bin/env node

import fs from 'node:fs'
import path from 'path'

const COMMANDS = {
  add: 'add',
  list: 'list',
  delete: 'delete',
  update: 'update',
  'mark-in-progress': 'mark-in-progress',
  'mark-done': 'mark-done',
}

type StatusCommand = keyof Pick<typeof COMMANDS, 'mark-in-progress' | 'mark-done'>

const TASK_STATUS = {
  todo: 'todo',
  'in-progress': 'in-progress',
  done: 'done',
} as const

type Task = {
  id: number
  description: string
  status: keyof typeof TASK_STATUS
  createdAt: string
  updatedAt: string
}

const tasksFilePath = path.resolve('tasks.json')

function showUsage() {
  console.log('Usage:')
  console.log('  add <description> - Add a new task')
  console.log('  update <id> <description> - Update a task description')
  console.log('  delete <id> - Remove a task by id')
  console.log('  mark-in-progress <id> - Mark a task as in-progress')
  console.log('  mark-done <id> - Mark a task as done')
  console.log('  list            - List all tasks')
  console.log('  list <status>   - List tasks filtered by status')
}

function handleError(error?: unknown) {
  if (!error || !(error instanceof Error)) return
  if (error.message) {
    console.error(error.message)
  } else {
    console.error(`Unknown error is occurred.`)
  }
}

/**
 * Read json file and return as a Task array
 */
export function readTasks(): Task[] {
  const json = fs.readFileSync(tasksFilePath).toString('utf-8')
  if (!json) return []
  const tasks = JSON.parse(json)
  return tasks
}

/**
 * Convert given tasks and overwrite to json file
 */
export function writeTasks(tasks: Task[]): void {
  if (!tasks) return
  const str = tasks?.length > 0 ? JSON.stringify(tasks) : ''
  fs.writeFileSync(tasksFilePath, str, { encoding: 'utf-8' })
}

/**
 * Create a task with given description
 */
export function addTask(description: Task['description']): Task['id'] {
  if (!description) throw new Error(`Description is required.`)
  const tasks = readTasks()
  const id = tasks.length > 0 ? Math.max(...tasks.map((t) => t.id)) + 1 : 1
  const now = new Date().toISOString()
  writeTasks([...tasks, { id, description, status: 'todo', createdAt: now, updatedAt: now }])
  return id
}

/**
 * Delete specified task
 * @returns Is specified task existed (or not exist and nothing changed)
 */
export function deleteTask(id: Task['id']): boolean {
  if (!id) throw new Error(`ID is required.`)
  const tasks = readTasks()
  const isExist = tasks.some((t) => t.id === id)
  if (!isExist) return isExist
  writeTasks(tasks.filter((t) => t.id !== id))
  return isExist
}

/**
 * Update specified task's description
 * @throws task must exist and new description is required
 */
export function updateTask(id: Task['id'], description: Task['description']) {
  if (!id || !description) throw new Error(`ID and description are required.`)
  const tasks = readTasks()
  if (!tasks.some((t) => t.id === id)) throw new Error(`Unknown id.`)
  writeTasks(
    tasks.map((t) => {
      if (t.id !== id) return t
      return {
        ...t,
        description,
        updatedAt: new Date().toISOString(),
      }
    })
  )
}

/**
 * Update specified tasks's status
 * @returns Is specified task existed (or not exist and nothing changed)
 */
export function markTaskStatus(statusCommand: StatusCommand, id: Task['id']): boolean {
  if (!statusCommand || !id) throw new Error(`ID and target status is required.`)
  const status =
    statusCommand === 'mark-done'
      ? TASK_STATUS.done
      : statusCommand === 'mark-in-progress'
      ? TASK_STATUS['in-progress']
      : ''
  if (!status) throw new Error(`Unknown target status.`)
  const tasks = readTasks()
  const isExist = tasks.some((t) => t.id === id)
  if (!isExist) return isExist
  writeTasks(
    tasks.map((t) => {
      if (t.id !== id) return t
      return {
        ...t,
        status,
        updatedAt: new Date().toISOString(),
      }
    })
  )
  return isExist
}

/**
 * Return status matched tasks
 */
export function filterTasks(status?: Task['status']): Task[] {
  const tasks = readTasks()
  if (!status) return tasks
  if (!Object.values(TASK_STATUS).includes(status)) throw new Error(`Unknown status.`)
  return tasks.filter((t) => t.status === status)
}

/**
 * 1. Parse CLI args
 * 2. Modify tasks
 * 3. [Optional] Console result or Error message.
 * @returns
 */
function main() {
  const args = process.argv.slice(2)
  if (args.length === 0 || ['-h', '--help'].includes(args?.[0])) {
    showUsage()
    return
  }
  const command = args[0]
  try {
    switch (command) {
      case COMMANDS.add: {
        const id = addTask(args[1])
        console.log(`Task added successfully (ID: ${id})`)
        break
      }
      case COMMANDS.update: {
        updateTask(Number(args[1]), args[2])
        break
      }
      case COMMANDS.delete: {
        const isDeleted = deleteTask(Number(args[1]))
        if (isDeleted) {
          console.log(`Successfully deleted.`)
        }
        break
      }
      case COMMANDS['mark-in-progress']:
      case COMMANDS['mark-done']:
        const isMarked = markTaskStatus(command as StatusCommand, Number(args[1]))
        if (isMarked) {
          console.log(`Successfully marked.`)
        }
        break
      case COMMANDS.list: {
        const tasks = filterTasks(args?.[1] as Task['status'] | undefined)
        tasks.forEach((t) => console.log(`${t.status}: ${t.description} (ID: ${t.id})`))
        break
      }
      default:
        showUsage()
        break
    }
  } catch (error) {
    handleError(error)
    process.exit(1)
  }
}

main()
