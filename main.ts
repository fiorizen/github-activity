#!/usr/bin/env ts-node

import fs from 'node:fs'
import path from 'path'

type Task = {
  id: number
  title: string
}

const tasksFilePath = path.resolve('tasks.json')

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
  const str = JSON.stringify(tasks)
  fs.writeFileSync(tasksFilePath, str, { encoding: 'utf-8' })
}

/**
 * 条件に応じてタスクを絞り込んで返す
 * TODO: 条件設定対応
 */
export function listTasks() {
  const tasks = readTasks()
  return tasks
}

// TODO: コマンドライン引数を解釈して必要な関数を実行する
