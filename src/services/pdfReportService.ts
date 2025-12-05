import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DataValidationReport } from './dataValidationReport';

// Add type augmentation for jsPDF to include autoTable properties
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
    autoTable: typeof autoTable;
  }
}

export class PDFReportService {
  static generateDataValidationPDF(report: DataValidationReport): Blob {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(33, 33, 33);
    doc.text('Email Threat Analysis', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text('Data Validation Report', pageWidth / 2, 30, { align: 'center' });
    
    // Report metadata
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date(report.timestamp).toLocaleString()}`, pageWidth / 2, 40, { align: 'center' });
    doc.text(`Report ID: ${report.timestamp.split('T')[0]}-${Math.random().toString(36).substring(7)}`, pageWidth / 2, 45, { align: 'center' });
    
    // Summary section
    doc.setFontSize(14);
    doc.setTextColor(33, 33, 33);
    doc.text('Summary', 14, 60);
    
    const summaryData = [
      ['Total Data Points', report.totalDataPoints.toString()],
      ['Real Data Points', report.realDataPoints.toString()],
      ['Fake Data Points', report.fakeDataPoints.toString()],
      ['Missing Data Points', report.missingDataPoints.toString()],
      ['Real Data Percentage', `${report.realDataPercentage}%`]
    ];
    
    autoTable(doc, {
      startY: 65,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      margin: { top: 65 }
    });
    
    let finalY = (doc as any).lastAutoTable.finalY;
    
    // Data Sources section
    doc.setFontSize(14);
    doc.setTextColor(33, 33, 33);
    doc.text('Data Sources Analysis', 14, finalY + 15);
    
    const dataSourcesArray = Object.entries(report.dataSources).map(([key, data]) => [
      key.replace(/([A-Z])/g, ' $1').trim(),
      data.status.toUpperCase(),
      data.description,
      data.apiUsed || 'N/A',
      `${data.confidence}%`
    ]);
    
    autoTable(doc, {
      startY: finalY + 20,
      head: [['Data Source', 'Status', 'Description', 'API Used', 'Confidence']],
      body: dataSourcesArray,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 20 },
        2: { cellWidth: 60 },
        3: { cellWidth: 40 },
        4: { cellWidth: 20 }
      }
    });
    
    finalY = (doc as any).lastAutoTable.finalY;
    
    // Recommendations section
    if (finalY > 220) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(33, 33, 33);
      doc.text('Recommendations', 14, 20);
      
      const recommendationsArray = report.recommendations.map(rec => [rec]);
      
      autoTable(doc, {
        startY: 25,
        head: [['Action Needed']],
        body: recommendationsArray,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }
      });
      
      finalY = (doc as any).lastAutoTable.finalY;
    } else {
      doc.setFontSize(14);
      doc.setTextColor(33, 33, 33);
      doc.text('Recommendations', 14, finalY + 15);
      
      const recommendationsArray = report.recommendations.map(rec => [rec]);
      
      autoTable(doc, {
        startY: finalY + 20,
        head: [['Action Needed']],
        body: recommendationsArray,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }
      });
      
      finalY = (doc as any).lastAutoTable.finalY;
    }
    
    // Additional APIs section
    if (finalY > 220) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(33, 33, 33);
      doc.text('Recommended Additional APIs', 14, 20);
      
      const apisArray = report.additionalAPIs.map(api => [api]);
      
      autoTable(doc, {
        startY: 25,
        head: [['API Name']],
        body: apisArray,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }
      });
    } else {
      doc.setFontSize(14);
      doc.setTextColor(33, 33, 33);
      doc.text('Recommended Additional APIs', 14, finalY + 15);
      
      const apisArray = report.additionalAPIs.map(api => [api]);
      
      autoTable(doc, {
        startY: finalY + 20,
        head: [['API Name']],
        body: apisArray,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }
      });
    }
    
    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Email Threat Analysis - Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }
    
    return doc.output('blob');
  }
}