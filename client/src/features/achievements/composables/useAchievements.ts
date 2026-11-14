import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AchievementCatalogueResponse, AchievementCategoryGroup } from '@bookorbit/types'
import { fetchAchievements } from '../api/achievementsApi'

export function useAchievements() {
  const { t, te } = useI18n()
  const rawCategories = ref<AchievementCategoryGroup[]>([])
  const totalEarned = ref(0)
  const totalAvailable = ref(0)
  const loading = ref(true)
  const error = ref(false)

  function translate(key: string, fallback: string): string {
    return te(key) ? t(key) : fallback
  }

  const categories = computed(() =>
    rawCategories.value.map((category) => ({
      ...category,
      label: translate(`achievements.categories.${category.key}`, category.label),
      achievements: category.achievements.map((achievement) => ({
        ...achievement,
        name: translate(`achievements.items.${achievement.key}.name`, achievement.name),
        description: translate(`achievements.items.${achievement.key}.description`, achievement.description),
      })),
    })),
  )

  async function load() {
    loading.value = true
    error.value = false
    try {
      const data: AchievementCatalogueResponse = await fetchAchievements()
      rawCategories.value = data.categories
      totalEarned.value = data.totalEarned
      totalAvailable.value = data.totalAvailable
    } catch {
      error.value = true
    } finally {
      loading.value = false
    }
  }

  onMounted(load)

  return { categories, totalEarned, totalAvailable, loading, error, reload: load }
}
