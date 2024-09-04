import { fs as mfs, vol } from 'memfs'
import { mock, describe, it, beforeEach, afterEach, after } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  filterTasks,
  readTasks,
  writeTasks,
  addTask,
  deleteTask,
  updateTask,
  markTaskStatus,
} from './main.js'
import fs from 'node:fs'
const { readFileSync } = mfs

// テスト中は実際のファイルは触らない
mock.method(fs, 'readFileSync', mfs.readFileSync)
mock.method(fs, 'writeFileSync', mfs.writeFileSync)

const startTime = '2024-01-02T11:01:58.135Z'

beforeEach(() => {
  mock.timers.enable({
    apis: ['Date'],
    now: new Date(startTime),
  })
})
afterEach(() => {
  mock.timers.reset()
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
    const result = readTasks()
    assert.deepEqual(result, [
      {
        status: 'todo',
        createdAt: '2024-01-02T11:01:58.135Z',
        updatedAt: '2024-01-02T11:01:58.135Z',
        id: 1,
        description: 'task1new',
      },
      {
        status: 'todo',
        createdAt: '2024-01-02T11:01:58.135Z',
        updatedAt: '2024-01-02T11:01:58.135Z',
        id: 2,
        description: 'task2',
      },
    ])
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
  const startJSON = JSON.stringify([
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
      'tasks.json': startJSON,
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
    assert.deepEqual(result, startJSON)
  })
})
describe('updateTask', () => {
  const startJSON = JSON.stringify([
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
    {
      ...commonTask,
      id: 3,
      description: 'task3',
    },
  ])
  beforeEach(() => {
    vol.fromJSON({
      'tasks.json': startJSON,
    })
  })
  after(() => vol.reset())
  it('Nothing changes with no args', () => {
    updateTask()
    const result = mfs.readFileSync('tasks.json', 'utf8')
    assert.deepEqual(result, startJSON)
  })
  it('Nothing changes with no id', () => {
    updateTask(undefined, 'updated task')
    const result = mfs.readFileSync('tasks.json', 'utf8')
    assert.deepEqual(result, startJSON)
  })
  it('Nothing changes with no description', () => {
    updateTask(1)
    const result = mfs.readFileSync('tasks.json', 'utf8')
    assert.deepEqual(result, startJSON)
  })
  it('Nothing changes with new id', () => {
    updateTask(99, 'updated task')
    const result = mfs.readFileSync('tasks.json', 'utf8')
    assert.deepEqual(result, startJSON)
  })
  it('Update task1 description', () => {
    mock.timers.tick(1000)
    updateTask(1, 'updated task1')
    const result = mfs.readFileSync('tasks.json', 'utf8')
    assert.deepEqual(
      result,
      JSON.stringify([
        {
          ...commonTask,
          id: 1,
          description: 'updated task1',
          updatedAt: '2024-01-02T11:01:59.135Z',
        },
        {
          ...commonTask,
          id: 2,
          description: 'task2',
        },
        {
          ...commonTask,
          id: 3,
          description: 'task3',
        },
      ])
    )
  })
})

describe('markTaskStatus', () => {
  const initialTasks = [
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
    {
      ...commonTask,
      id: 3,
      description: 'task3',
    },
  ]
  const startJSON = JSON.stringify(initialTasks)
  beforeEach(() => {
    vol.fromJSON({
      'tasks.json': startJSON,
    })
  })
  after(() => vol.reset())
  it('Nothing changes with no args', () => {
    markTaskStatus()
    assert.deepEqual(readTasks(), initialTasks)
  })
  it('Nothing changes with no id', () => {
    markTaskStatus('mark-in-progress')
    assert.deepEqual(readTasks(), initialTasks)
  })
  it('Nothing changes with incorrect status', () => {
    markTaskStatus('incorrect', 1)
    assert.deepEqual(readTasks(), initialTasks)
  })
  it('Nothing changes with new id', () => {
    markTaskStatus('mark-in-progress', 99)
    assert.deepEqual(readTasks(), initialTasks)
  })
  it('Update task1 as in-progress', () => {
    mock.timers.tick(1000)
    markTaskStatus('mark-in-progress', 1)
    assert.deepEqual(readTasks(), [
      {
        ...commonTask,
        id: 1,
        description: 'task1',
        status: 'in-progress',
        updatedAt: '2024-01-02T11:01:59.135Z',
      },
      {
        ...commonTask,
        id: 2,
        description: 'task2',
      },
      {
        ...commonTask,
        id: 3,
        description: 'task3',
      },
    ])
  })
  it('Update task2 as done', () => {
    mock.timers.tick(1000)
    markTaskStatus('mark-done', 2)
    assert.deepEqual(readTasks(), [
      {
        ...commonTask,
        id: 1,
        description: 'task1',
      },
      {
        ...commonTask,
        id: 2,
        description: 'task2',
        status: 'done',
        updatedAt: '2024-01-02T11:01:59.135Z',
      },
      {
        ...commonTask,
        id: 3,
        description: 'task3',
      },
    ])
  })
})
