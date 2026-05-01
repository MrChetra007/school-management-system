import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useClassSubjectsStore = defineStore('classSubjects', () => {
  const subjectsByClass = ref({})
  const loading = ref(false)

  async function fetchSubjectsForClass(classId) {
    if (!classId) return []
    
    // Return cached if available
    if (subjectsByClass.value[classId]) {
      return subjectsByClass.value[classId]
    }

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('class_subjects')
        .select(`
          subject_id,
          subjects (
            id,
            subject_name
          )
        `)
        .eq('class_id', classId)

      if (error) throw error

      const subjects = data.map(item => item.subjects)
      subjectsByClass.value[classId] = subjects
      return subjects
    } catch (err) {
      console.error('Error fetching subjects for class:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  function clearCache() {
    subjectsByClass.value = {}
  }

  return {
    subjectsByClass,
    loading,
    fetchSubjectsForClass,
    clearCache
  }
})
