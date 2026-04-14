import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { Session, CafeSettings } from '../types';
import { formatDH, formatDate, formatTime } from './formatters';

export const generateReportPDF = (sessions: Session[], settings: CafeSettings | null, period: string) => {
  const doc = new jsPDF() as any;
  const cafeName = settings?.cafe_name || 'Nook OS';
  const ownerName = settings?.owner_name || '';

  // Header
  doc.setFontSize(22);
  doc.setTextColor(249, 115, 22); // Orange
  doc.text(cafeName, 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Propriétaire: ${ownerName}`, 14, 26);
  doc.text(`Rapport pour la période: ${period}`, 14, 31);
  doc.text(`Généré le: ${formatDate(new Date())} à ${formatTime(new Date())}`, 14, 36);

  // Table
  const tableData = sessions.map(s => [
    formatDate(s.started_at),
    s.customer_name,
    `${s.duration_minutes || 0} min`,
    formatDH(s.total_amount),
    s.payment_method || '-'
  ]);

  doc.autoTable({
    startY: 45,
    head: [['Date', 'Client', 'Durée', 'Montant', 'Paiement']],
    body: tableData,
    headStyles: { fillColor: [249, 115, 22] },
    margin: { top: 45 },
  });

  // Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const totalRevenue = sessions.reduce((acc, s) => acc + s.total_amount, 0);

  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Résumé Financier', 14, finalY);

  doc.setFontSize(11);
  doc.text(`Nombre total de sessions: ${sessions.length}`, 14, finalY + 7);
  doc.text(`Recette totale: ${formatDH(totalRevenue)}`, 14, finalY + 13);

  const ht = totalRevenue / 1.2;
  const tva = totalRevenue - ht;

  doc.text(`Recette HT: ${formatDH(ht)}`, 14, finalY + 23);
  doc.text(`TVA (20%): ${formatDH(tva)}`, 14, finalY + 28);
  doc.setFont(undefined, 'bold');
  doc.text(`Total TTC: ${formatDH(totalRevenue)}`, 14, finalY + 34);

  // Footer
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text('Généré par Nook OS - La gestion intelligente de votre café.', 14, doc.internal.pageSize.height - 10);

  doc.save(`Nook_Rapport_${period.replace(/ /g, '_')}.pdf`);
};
