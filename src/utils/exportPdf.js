import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates a PDF for monthly scores.
 * @param {HTMLElement} element - The HTML element to capture.
 * @param {Object} metadata - { schoolName, className, month, year }
 */
export async function generateMonthlyScorePDF(element, metadata) {
  try {
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Monthly_Scores_${metadata.className}_${metadata.month}_${metadata.year}.pdf`);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
}

/**
 * Generates a PDF for semester scores.
 * @param {HTMLElement} element - The HTML element to capture.
 * @param {Object} metadata - { schoolName, className, semester, year }
 */
export async function generateSemesterScorePDF(element, metadata) {
  try {
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Semester_Scores_${metadata.className}_Sem${metadata.semester}_${metadata.year}.pdf`);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
}
