import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'

vi.mock('@/lib/api', () => ({
  api: vi.fn<() => Promise<Response>>(),
}))

import { api } from '@/lib/api'
import { setI18nLocale } from '@/i18n'
import { useAchievements } from '../composables/useAchievements'

const mockApi = vi.mocked(api)

function mockResponse(data: unknown) {
  return { ok: true, json: () => Promise.resolve(data) } as Response
}

const MOCK_CATALOGUE = {
  categories: [
    {
      key: 'reading',
      label: 'Reading',
      earnedCount: 2,
      totalCount: 10,
      achievements: [
        {
          key: 'books_finished_1',
          groupKey: 'books_finished',
          tier: 1,
          category: 'reading',
          name: 'First Steps',
          description: 'Finish 1 book',
          iconName: 'book-open',
          rarity: 'common',
          threshold: 1,
          hidden: false,
          sortOrder: 1,
          earned: true,
          awardedAt: '2026-01-01T00:00:00Z',
          context: null,
          currentProgress: null,
        },
      ],
    },
  ],
  totalEarned: 2,
  totalAvailable: 49,
}

function mountComposable() {
  let result!: ReturnType<typeof useAchievements>
  mount(
    defineComponent({
      setup() {
        result = useAchievements()
        return () => null
      },
    }),
  )
  return result
}

describe('useAchievements', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await setI18nLocale('en')
  })

  it('fetches achievements on mount', async () => {
    mockApi.mockResolvedValue(mockResponse(MOCK_CATALOGUE))
    const { categories, totalEarned, totalAvailable, loading } = mountComposable()

    expect(loading.value).toBe(true)
    await flushPromises()
    expect(loading.value).toBe(false)
    expect(categories.value).toHaveLength(1)
    expect(totalEarned.value).toBe(2)
    expect(totalAvailable.value).toBe(49)
  })

  it('localizes achievement text and reacts to locale changes', async () => {
    mockApi.mockResolvedValue(mockResponse(MOCK_CATALOGUE))
    await setI18nLocale('zh')
    const { categories } = mountComposable()

    await flushPromises()
    expect(categories.value[0]?.label).toBe('阅读')
    expect(categories.value[0]?.achievements[0]?.name).toBe('初染墨香')
    expect(categories.value[0]?.achievements[0]?.description).toBe('读完第一本书')

    await setI18nLocale('en')
    expect(categories.value[0]?.label).toBe('Reading')
    expect(categories.value[0]?.achievements[0]?.name).toBe('Ink Initiate')
    expect(categories.value[0]?.achievements[0]?.description).toBe('Finish your first book')
  })

  it('sets error on failure', async () => {
    mockApi.mockResolvedValue({ ok: false } as Response)
    const { error, loading } = mountComposable()

    await flushPromises()
    expect(loading.value).toBe(false)
    expect(error.value).toBe(true)
  })

  it('reload refetches data', async () => {
    mockApi.mockResolvedValue(mockResponse(MOCK_CATALOGUE))
    const { reload, totalEarned } = mountComposable()

    await flushPromises()
    expect(totalEarned.value).toBe(2)

    mockApi.mockResolvedValue(mockResponse({ ...MOCK_CATALOGUE, totalEarned: 5 }))
    await reload()
    expect(totalEarned.value).toBe(5)
  })
})
