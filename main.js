#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

const tasksFilePath = path.resolve('tasks.json')

/**
 * 現状のTaskをすべて返す
 */
export function readTasks() {
  const tasks = JSON.parse(fs.readFileSync(tasksFilePath).toString('utf-8'))
  return tasks
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
