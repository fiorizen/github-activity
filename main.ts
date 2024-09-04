#!/usr/bin/env ts-node

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

/**
 * 現状のTaskをすべて返す
 */
export function readTasks(): Task[] {
  const json = fs.readFileSync(tasksFilePath).toString('utf-8')
  if (!json) return []
  const tasks = JSON.parse(json)
  return tasks
}

/**
 * 引数でJSONファイルを上書きする
 */
export function writeTasks(tasks: Task[]): void {
  if (!tasks) return
  const str = tasks?.length > 0 ? JSON.stringify(tasks) : ''
  fs.writeFileSync(tasksFilePath, str, { encoding: 'utf-8' })
}

export function addTask(description: Task['description']): Task['id'] {
  const tasks = readTasks()
  const id = tasks.length > 0 ? Math.max(...tasks.map((t) => t.id)) + 1 : 1
  const now = new Date().toISOString()
  writeTasks([...tasks, { id, description, status: 'todo', createdAt: now, updatedAt: now }])
  return id
}

export function deleteTask(id: Task['id']) {
  if (!id) return
  const tasks = readTasks()
  writeTasks(tasks.filter((t) => t.id !== id))
}

export function updateTask(id: Task['id'], description: Task['description']) {
  if (!id || !description) return
  const tasks = readTasks()
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

export function markTaskStatus(statusCommand: StatusCommand, id: Task['id']) {
  if (!statusCommand || !id) return
  const status =
    statusCommand === 'mark-done'
      ? TASK_STATUS.done
      : statusCommand === 'mark-in-progress'
      ? TASK_STATUS['in-progress']
      : ''
  if (!status) return
  const tasks = readTasks()
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
}

/**
 * 条件に応じてタスクを絞り込んで返す
 */
export function filterTasks(status?: Task['status']): Task[] {
  const tasks = readTasks()
  if (!status) return tasks
  return tasks.filter((t) => t.status === status)
}

function main() {
  const args = process.argv.slice(2)
  if (args.length === 0 || ['-h', '--help'].includes(args?.[0])) {
    showUsage()
    return
  }
  const command = args[0]
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
      deleteTask(Number(args[1]))
      break
    }
    case COMMANDS['mark-in-progress']:
    case COMMANDS['mark-done']:
      markTaskStatus(command as StatusCommand, Number(args[1]))
      break
    case COMMANDS.list: {
      const tasks = filterTasks(args?.[1] as Task['status'] | undefined)
      tasks.forEach((t) => console.log(`${t.status}: ${t.description} (ID: ${t.id})`))
      break
    }
    default:
      break
  }
}

main()
