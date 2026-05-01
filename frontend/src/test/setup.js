import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach } from 'vitest'

// Унифицированная очередь записи и read-cache хранятся в localStorage.
// Чистим перед каждым тестом, чтобы тесты не подглядывали друг другу состояние.
beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})
