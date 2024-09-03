import { fs as mfs, vol } from 'memfs'
import { mock, describe, it, beforeEach, afterEach, after } from 'node:test'
import { strict as assert } from 'node:assert'
import { listTasks, readTasks, writeTasks, addTask } from './main.js'
import fs from 'node:fs'
const { readFileSync } = mfs

// テスト中は実際のファイルは触らない
mock.method(fs, 'readFileSync', mfs.readFileSync)
mock.method(fs, 'writeFileSync', mfs.writeFileSync)

describe('readTasks', () => {
  beforeEach(() => {
    vol.fromJSON({
      'tasks.json': JSON.stringify([
        { id: 1, title: 'task1' },
        { id: 2, title: 'task2' },
      ]),
    })
  })
  after(() => {
    vol.reset()
  })
  it('Always return all tasks', () => {
    const res = readTasks()
    assert.deepEqual(res, [
      { id: 1, title: 'task1' },
      { id: 2, title: 'task2' },
    ])
  })
})

describe('listTasks', () => {
  beforeEach(() => {
    vol.fromJSON({
      'tasks.json': JSON.stringify([
        { id: 1, title: 'task1' },
        { id: 2, title: 'task2' },
      ]),
    })
  })
  afterEach(() => {
    vol.reset()
  })
  it('with no args: should return all tasks', () => {
    const res = listTasks()
    assert.deepEqual(res, [
      { id: 1, title: 'task1' },
      { id: 2, title: 'task2' },
    ])
  })
})

describe('writeTasks', () => {
  beforeEach(() => {
    vol.fromJSON({
      'tasks.json': JSON.stringify([{ id: 1, title: 'task1' }]),
    })
  })
  afterEach(() => {
    vol.reset()
  })
  it('Happy: overwrite whole data with arg', () => {
    writeTasks([
      { id: 1, title: 'task1new' },
      { id: 2, title: 'task2' },
    ])
    const result = readFileSync('tasks.json', 'utf8')
    assert.deepEqual(result, '[{"id":1,"title":"task1new"},{"id":2,"title":"task2"}]')
  })
  it('Happy: Nothing changed with no arg', () => {
    writeTasks()
    const result = readFileSync('tasks.json', 'utf8')
    assert.deepEqual(result, '[{"id":1,"title":"task1"}]')
  })
})
