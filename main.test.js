import { fs as mfs, vol } from 'memfs'
import { mock, describe, it, beforeEach, afterEach, after } from 'node:test'
import { strict as assert } from 'node:assert'
import { filterTasks, readTasks, writeTasks, addTask, deleteTask } from './main.js'
import fs from 'node:fs'
const { readFileSync } = mfs

// テスト中は実際のファイルは触らない
mock.method(fs, 'readFileSync', mfs.readFileSync)
mock.method(fs, 'writeFileSync', mfs.writeFileSync)

const startTime = '2024-01-02T11:01:58.135Z'
mock.timers.enable({
  apis: ['Date'],
  now: new Date(startTime),
})

const commonTask = {
  status: 'todo',
  createdAt: startTime,
  updatedAt: startTime,
}

describe('readTasks', () => {
  beforeEach(() => {
    vol.fromJSON({
      'tasks.json': JSON.stringify([
        { ...commonTask, id: 1, description: 'task1' },
        { ...commonTask, id: 2, description: 'task2' },
      ]),
    })
  })
  after(() => {
    vol.reset()
  })
  it('Always return all tasks', () => {
    const res = readTasks()
    assert.deepEqual(res, [
      { ...commonTask, id: 1, description: 'task1' },
      { ...commonTask, id: 2, description: 'task2' },
    ])
  })
})

describe('filterTasks', () => {
  beforeEach(() => {
    vol.fromJSON({
      'tasks.json': JSON.stringify([
        { ...commonTask, id: 1, description: 'task1' },
        { ...commonTask, id: 2, description: 'task2' },
      ]),
    })
  })
  afterEach(() => {
    vol.reset()
  })
  it('with no args: should return all tasks', () => {
    const res = filterTasks()
    assert.deepEqual(res, [
      { ...commonTask, id: 1, description: 'task1' },
      { ...commonTask, id: 2, description: 'task2' },
    ])
  })
})

describe('writeTasks', () => {
  beforeEach(() => {
    vol.fromJSON({
      'tasks.json': JSON.stringify([{ ...commonTask, id: 1, description: 'task1' }]),
    })
  })
  afterEach(() => {
    vol.reset()
  })
  it('Happy: overwrite whole data with arg', () => {
    writeTasks([
      { ...commonTask, id: 1, description: 'task1new' },
      { ...commonTask, id: 2, description: 'task2' },
    ])
    const result = readFileSync('tasks.json', 'utf8')
    assert.deepEqual(
      result,
      '[{"status":"todo","createdAt":"2024-01-02T11:01:58.135Z","updatedAt":"2024-01-02T11:01:58.135Z","id":1,"description":"task1new"},{"status":"todo","createdAt":"2024-01-02T11:01:58.135Z","updatedAt":"2024-01-02T11:01:58.135Z","id":2,"description":"task2"}]'
    )
  })
  it('Happy: Nothing changed with no arg', () => {
    writeTasks()
    const result = readFileSync('tasks.json', 'utf8')
    assert.deepEqual(
      result,
      '[{"status":"todo","createdAt":"2024-01-02T11:01:58.135Z","updatedAt":"2024-01-02T11:01:58.135Z","id":1,"description":"task1"}]'
    )
  })
})

describe('addTask', () => {
  beforeEach(() => {
    vol.fromJSON({
      'tasks.json': JSON.stringify([{ id: 1, description: 'task1', status: 'todo' }]),
    })
  })
  afterEach(() => {
    vol.reset()
  })
  it('Happy: Add task with id 1 if null', () => {
    vol.fromJSON({ 'tasks.json': '' })
    const id = addTask('first task')
    assert.equal(id, 1)
    const result = mfs.readFileSync('tasks.json', 'utf8')
    assert.deepEqual(
      result,
      '[{"id":1,"description":"first task","status":"todo","createdAt":"2024-01-02T11:01:58.135Z","updatedAt":"2024-01-02T11:01:58.135Z"}]'
    )
  })
  it('Happy: Add task with incremented ID', () => {
    const id = addTask('new task')
    assert.equal(id, 2)
    const result = mfs.readFileSync('tasks.json', 'utf8')
    assert.deepEqual(
      result,
      '[{"id":1,"description":"task1","status":"todo"},{"id":2,"description":"new task","status":"todo","createdAt":"2024-01-02T11:01:58.135Z","updatedAt":"2024-01-02T11:01:58.135Z"}]'
    )
  })
})

describe('deleteTask', () => {
  const startJson = JSON.stringify([
    {
      ...commonTask,
      id: 1,
      description: 'task1',
    },
    {
      ...commonTask,
      id: 2,
      description: 'task2',
    },
  ])
  beforeEach(() => {
    vol.fromJSON({
      'tasks.json': startJson,
    })
  })
  after(() => vol.reset())
  it('Happy: delete a task from multiple tasks', () => {
    deleteTask(1)
    const result = mfs.readFileSync('tasks.json', 'utf8')
    assert.deepEqual(
      result,
      JSON.stringify([
        {
          ...commonTask,
          id: 2,
          description: 'task2',
        },
      ])
    )
  })
  it('Happy: delete all task', () => {
    deleteTask(1)
    deleteTask(2)
    const result = mfs.readFileSync('tasks.json', 'utf8')
    assert.deepEqual(result, '')
  })
  it('Sad: Nothing changed with no arg', () => {
    deleteTask()
    const result = mfs.readFileSync('tasks.json', 'utf8')
    assert.deepEqual(result, startJson)
  })
})
