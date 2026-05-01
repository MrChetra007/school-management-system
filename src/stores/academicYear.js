import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useAcademicYearStore = defineStore('academicYear', () => {
  const selectedYearId = ref(localStorage.getItem('selected_academic_year_id') || null)
  const selectedYearName = ref(localStorage.getItem('selected_academic_year_name') || null)

  function setYear(id, name) {
    selectedYearId.value = id
    selectedYearName.value = name
    localStorage.setItem('selected_academic_year_id', id)
    localStorage.setItem('selected_academic_year_name', name)
  }

  function clearYear() {
    selectedYearId.value = null
    selectedYearName.value = null
    localStorage.removeItem('selected_academic_year_id')
    localStorage.removeItem('selected_academic_year_name')
  }

  const isYearSelected = () => !!selectedYearId.value

  return {
    selectedYearId,
    selectedYearName,
    setYear,
    clearYear,
    isYearSelected
  }
})
