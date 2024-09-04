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
  const initialTasks = [
    { ...commonTask, id: 1, description: 'task1' },
    { ...commonTask, id: 2, description: 'task2' },
  ]
  beforeEach(() => {
    vol.fromJSON({
      'tasks.json': JSON.stringify(initialTasks),
    })
  })
  after(() => {
    vol.reset()
  })
  it('Always return all tasks', () => {
    assert.deepEqual(readTasks(), initialTasks)
  })
})

describe('filterTasks', () => {
  const initialTasks = [
    { ...commonTask, id: 1, description: 'this is a todo task' },
    { ...commonTask, id: 2, description: 'this is an in-progress task', status: 'in-progress' },
    { ...commonTask, id: 3, description: 'this is a done task', status: 'done' },
  ]
  beforeEach(() => {
    vol.fromJSON({
      'tasks.json': JSON.stringify(initialTasks),
    })
  })
  afterEach(() => {
    vol.reset()
  })
  it('with no args: should return all tasks', () => {
    const res = filterTasks()
    assert.deepEqual(res, initialTasks)
  })
  it('Sad: Should throw with unknown status', () => {
    assert.throws(() => filterTasks('unknown status'))
  })
  it('Should return todo tasks', () => {
    assert.deepEqual(filterTasks('todo'), [
      { ...commonTask, id: 1, description: 'this is a todo task' },
    ])
  })
  it('Should return in-progress tasks', () => {
    assert.deepEqual(filterTasks('in-progress'), [
      { ...commonTask, id: 2, description: 'this is an in-progress task', status: 'in-progress' },
    ])
  })
  it('Should return done tasks', () => {
    assert.deepEqual(filterTasks('done'), [
      { ...commonTask, id: 3, description: 'this is a done task', status: 'done' },
    ])
  })
})

describe('writeTasks', () => {
  beforeEach(() => {
    const initialTasks = [{ ...commonTask, id: 1, description: 'task1' }]
    vol.fromJSON({
      'tasks.json': JSON.stringify(initialTasks),
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
    assert.deepEqual(readTasks(), [
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
  const initialTasks = [{ ...commonTask, id: 1, description: 'task1', status: 'todo' }]
  beforeEach(() => {
    vol.fromJSON({
      'tasks.json': JSON.stringify(initialTasks),
    })
  })
  afterEach(() => {
    vol.reset()
  })
  it('Nothing changes if description is null', () => {
    assert.throws(() => addTask(''))
    assert.deepEqual(readTasks(), initialTasks)
  })
  it('Happy: Add task with id 1 if null', () => {
    vol.fromJSON({ 'tasks.json': '' })
    const id = addTask('first task')
    assert.equal(id, 1)
    assert.deepEqual(readTasks(), [
      {
        id: 1,
        description: 'first task',
        status: 'todo',
        createdAt: '2024-01-02T11:01:58.135Z',
        updatedAt: '2024-01-02T11:01:58.135Z',
      },
    ])
  })
  it('Happy: Add task with incremented ID', () => {
    const id = addTask('new task')
    assert.equal(id, 2)
    assert.deepEqual(readTasks(), [
      { ...commonTask, id: 1, description: 'task1', status: 'todo' },
      {
        id: 2,
        description: 'new task',
        status: 'todo',
        createdAt: '2024-01-02T11:01:58.135Z',
        updatedAt: '2024-01-02T11:01:58.135Z',
      },
    ])
  })
})

describe('deleteTask', () => {
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
  ]
  const startJSON = JSON.stringify(initialTasks)
  beforeEach(() => {
    vol.fromJSON({
      'tasks.json': startJSON,
    })
  })
  after(() => vol.reset())
  it('Happy: delete a task from multiple tasks', () => {
    deleteTask(1)
    assert.deepEqual(readTasks(), [
      {
        ...commonTask,
        id: 2,
        description: 'task2',
      },
    ])
  })
  it('Happy: delete all task', () => {
    deleteTask(1)
    deleteTask(2)
    assert.deepEqual(readTasks(), [])
  })
  it('Sad: Nothing changed with no arg', () => {
    assert.throws(() => deleteTask())
    assert.deepEqual(readTasks(), initialTasks)
  })
  it('Sad: Nothing changed with unknown arg', () => {
    deleteTask(99)
    assert.deepEqual(readTasks(), initialTasks)
  })
})
describe('updateTask', () => {
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
    assert.throws(() => updateTask())
    assert.deepEqual(readTasks(), initialTasks)
  })
  it('Nothing changes with no id', () => {
    assert.throws(() => updateTask(undefined, 'updated task'))
    assert.deepEqual(readTasks(), initialTasks)
  })
  it('Nothing changes with no description', () => {
    assert.throws(() => updateTask(1))
    assert.deepEqual(readTasks(), initialTasks)
  })
  it('Nothing changes with new id', () => {
    assert.throws(() => updateTask(99, 'updated task'))
    assert.deepEqual(readTasks(), initialTasks)
  })
  it('Update task1 description', () => {
    mock.timers.tick(1000)
    updateTask(1, 'updated task1')
    assert.deepEqual(readTasks(), [
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
  it('Sad: Nothing changes with no args', () => {
    assert.throws(() => markTaskStatus())
    assert.deepEqual(readTasks(), initialTasks)
  })
  it('Nothing changes with no id', () => {
    assert.throws(() => markTaskStatus('mark-in-progress'))
    assert.deepEqual(readTasks(), initialTasks)
  })
  it('Nothing changes with incorrect status', () => {
    assert.throws(() => markTaskStatus('incorrect', 1))
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
