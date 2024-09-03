import { fs as mfs, vol } from 'memfs'
import { mock, describe, it, beforeEach, afterEach, after } from 'node:test'
import { strict as assert } from 'node:assert'
import { filterTasks, readTasks, writeTasks, addTask } from './main.js'
import fs from 'node:fs'
const { readFileSync } = mfs

// テスト中は実際のファイルは触らない
mock.method(fs, 'readFileSync', mfs.readFileSync)
mock.method(fs, 'writeFileSync', mfs.writeFileSync)

describe('readTasks', () => {
  beforeEach(() => {
    vol.fromJSON({
      'tasks.json': JSON.stringify([
        { id: 1, description: 'task1', status: 'todo' },
        { id: 2, description: 'task2', status: 'todo' },
      ]),
    })
  })
  after(() => {
    vol.reset()
  })
  it('Always return all tasks', () => {
    const res = readTasks()
    assert.deepEqual(res, [
      { id: 1, description: 'task1', status: 'todo' },
      { id: 2, description: 'task2', status: 'todo' },
    ])
  })
})

describe('filterTasks', () => {
  beforeEach(() => {
    vol.fromJSON({
      'tasks.json': JSON.stringify([
        { id: 1, description: 'task1', status: 'todo' },
        { id: 2, description: 'task2', status: 'todo' },
      ]),
    })
  })
  afterEach(() => {
    vol.reset()
  })
  it('with no args: should return all tasks', () => {
    const res = filterTasks()
    assert.deepEqual(res, [
      { id: 1, description: 'task1', status: 'todo' },
      { id: 2, description: 'task2', status: 'todo' },
    ])
  })
})

describe('writeTasks', () => {
  beforeEach(() => {
    vol.fromJSON({
      'tasks.json': JSON.stringify([{ id: 1, description: 'task1', status: 'todo' }]),
    })
  })
  afterEach(() => {
    vol.reset()
  })
  it('Happy: overwrite whole data with arg', () => {
    writeTasks([
      { id: 1, description: 'task1new', status: 'todo' },
      { id: 2, description: 'task2', status: 'todo' },
    ])
    const result = readFileSync('tasks.json', 'utf8')
    assert.deepEqual(
      result,
      '[{"id":1,"description":"task1new","status":"todo"},{"id":2,"description":"task2","status":"todo"}]'
    )
  })
  it('Happy: Nothing changed with no arg', () => {
    writeTasks()
    const result = readFileSync('tasks.json', 'utf8')
    assert.deepEqual(result, '[{"id":1,"description":"task1","status":"todo"}]')
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
    assert.deepEqual(result, '[{"id":1,"description":"first task","status":"todo"}]')
  })
  it('Happy: Add task with incremented ID', () => {
    const id = addTask('new task')
    assert.equal(id, 2)
    const result = mfs.readFileSync('tasks.json', 'utf8')
    assert.deepEqual(
      result,
      '[{"id":1,"description":"task1","status":"todo"},{"id":2,"description":"new task","status":"todo"}]'
    )
  })
})
