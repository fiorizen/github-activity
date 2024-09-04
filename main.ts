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

type Task = {
  id: number
  description: string
  status: 'todo' | 'in-progress' | 'done'
  createdAt: string
  updatedAt: string
}

const tasksFilePath = path.resolve('tasks.json')

function showUsage() {
  console.log('Usage:')
  console.log('  list       - List all tasks')
  console.log('  add <task> - Add a new task')
  console.log('  remove <id> - Remove a task by id')
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

/**
 * 条件に応じてタスクを絞り込んで返す
 * TODO: 条件設定対応
 */
export function filterTasks(status?: string): Task[] {
  const tasks = readTasks()
  return tasks
}

// TODO: コマンドライン引数を解釈して必要な関数を実行する
function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    showUsage()
    return
    // process.exit(1)
  }
  const command = args[0]
  switch (command) {
    case COMMANDS.add: {
      const id = addTask(args[1])
      console.log(`Task added successfully (ID: ${id})`)
      break
    }
    case COMMANDS.update: {
      console.log(`FIXME: UPDATE`)
      break
    }
    case COMMANDS.delete: {
      deleteTask(Number(args[1]))
      break
    }
    case COMMANDS.list: {
      console.log(filterTasks(args?.[1]))
      break
    }
    default:
      break
  }
}

main()
