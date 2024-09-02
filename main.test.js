import { describe, it, beforeEach, after } from 'node:test'
import { strict as assert } from 'node:assert'
import { listTasks } from './main.js'
import mock from 'mock-fs'

describe('readTasks', () => {
  beforeEach(() => {
    // テスト用データでモックする
    mock({
      'tasks.json': JSON.stringify([
        { id: 1, title: 'task1' },
        { id: 2, title: 'task2' },
      ]),
    })
  })
  after(() => {
    mock.restore()
  })
  it('Always return all tasks', () => {
    const res = listTasks()
    assert.deepEqual(res, [
      { id: 1, title: 'task1' },
      { id: 2, title: 'task2' },
    ])
  })
})

describe('listTasks', () => {
  beforeEach(() => {
    mock({
      'tasks.json': JSON.stringify([
        { id: 1, title: 'task1' },
        { id: 2, title: 'task2' },
      ]),
    })
  })
  after(() => {
    mock.restore()
  })
  it('with no args: should return all tasks', () => {
    const res = listTasks()
    assert.deepEqual(res, [
      { id: 1, title: 'task1' },
      { id: 2, title: 'task2' },
    ])
  })
})
