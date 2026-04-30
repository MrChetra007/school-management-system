/**
 * Score calculation logic as per roadmap.
 *
 * Monthly score: average of all subject scores for that month.
 * Semester score:
 *   1. monthly_average = avg of 3 monthly averages
 *   2. semester_exam_average = avg of semester exam subject scores
 *   3. semester_average = (monthly_average + semester_exam_average) / 2
 */

/**
 * @param {number[]} subjectScores
 * @returns {number}
 */
export function calcMonthlyAverage(subjectScores) {
  if (!subjectScores.length) return 0
  const sum = subjectScores.reduce((a, b) => a + b, 0)
  return parseFloat((sum / subjectScores.length).toFixed(2))
}

/**
 * @param {number[]} monthlyAverages  - e.g. [avg1, avg2, avg3]
 * @param {number[]} semesterExamScores - subject scores from the semester exam
 * @returns {{ monthlyPart: number, examPart: number, semesterAverage: number }}
 */
export function calcSemesterAverage(monthlyAverages, semesterExamScores) {
  const monthlyPart = calcMonthlyAverage(monthlyAverages)
  const examPart = calcMonthlyAverage(semesterExamScores)
  const semesterAverage = parseFloat(((monthlyPart + examPart) / 2).toFixed(2))
  return { monthlyPart, examPart, semesterAverage }
}

/**
 * Grade letter from score (0–100)
 * @param {number} score
 * @returns {string}
 */
export function gradeFromScore(score) {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}
