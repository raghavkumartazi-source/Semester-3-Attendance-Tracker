'use client';

import { useState } from 'react';
import { useAttendance } from './AttendanceProvider';
import { SUBJECTS } from '@/lib/config';
import { getSubjectAttendance } from '@/lib/calculations';
import { motion } from 'framer-motion';

export function ExportReportButton() {
  const { sessions } = useAttendance();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = document.createElement('div');
      element.innerHTML = `
        <div style="font-family: sans-serif; padding: 40px; color: #111;">
          <h1 style="text-align: center; color: #000; margin-bottom: 10px;">Semester Attendance Report</h1>
          <p style="text-align: center; color: #555; margin-bottom: 40px;">Generated on ${new Date().toLocaleDateString()}</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #f4f4f5; border-bottom: 2px solid #e4e4e7;">
                <th style="padding: 12px; text-align: left;">Subject</th>
                <th style="padding: 12px; text-align: center;">Total Classes</th>
                <th style="padding: 12px; text-align: center;">Attended</th>
                <th style="padding: 12px; text-align: center;">Missed</th>
                <th style="padding: 12px; text-align: right;">Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${SUBJECTS.map(subj => {
                const subjSessions = sessions.filter(s => s.subjectCode === subj.code);
                const stats = getSubjectAttendance(subjSessions);
                
                let color = '#3f3f46';
                if (stats.percentage !== null) {
                  if (stats.percentage >= 80) color = '#10b981'; // green
                  else if (stats.percentage >= 75) color = '#f59e0b'; // orange
                  else color = '#ef4444'; // red
                }
                
                return `
                  <tr style="border-bottom: 1px solid #e4e4e7;">
                    <td style="padding: 12px; font-weight: bold;">${subj.name} (${subj.code})</td>
                    <td style="padding: 12px; text-align: center;">${stats.totalConducted}</td>
                    <td style="padding: 12px; text-align: center;">${stats.present}</td>
                    <td style="padding: 12px; text-align: center;">${stats.absent}</td>
                    <td style="padding: 12px; text-align: right; color: ${color}; font-weight: bold;">
                      ${stats.percentage !== null ? stats.percentage.toFixed(1) + '%' : 'N/A'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 40px; font-size: 12px; color: #71717a; text-align: center;">
            This is an automatically generated attendance summary.
          </div>
        </div>
      `;
      
      const opt = {
        margin:       10,
        filename:     'Attendance_Report.pdf',
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      
      await html2pdf().set(opt).from(element).save();
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleExport}
      disabled={isExporting}
      className="w-full glass-button bg-indigo-500/10 text-indigo-300 border-indigo-500/20 py-3 rounded-2xl flex items-center justify-center gap-2 font-medium"
    >
      {isExporting ? (
        <span className="animate-pulse">Generating PDF...</span>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export PDF Report
        </>
      )}
    </motion.button>
  );
}
