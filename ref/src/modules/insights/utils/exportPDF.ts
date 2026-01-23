/**
 * PDF Export Module
 * Exports timelines, formulas, and insights to PDF
 */
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Export current timeline view to PDF
 */
export async function exportTimelineToPDF(timelineElement: any, eventType: any, projectName = 'SpatialLens') {
  if (!timelineElement) return;
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Add header
  pdf.setFontSize(16);
  pdf.text(`${projectName} - Timeline`, 15, 15);
  pdf.setFontSize(12);
  pdf.text(`Event Type: ${eventType}`, 15, 22);
  pdf.setFontSize(8);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, 15, 27);
  
  // Capture timeline as canvas
  const canvas = await html2canvas(timelineElement, {
    scale: 2,
    backgroundColor: '#1a1d21',
    logging: false
  });
  
  const imgData = canvas.toDataURL('image/png');
  const imgWidth = pageWidth - 30;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  // Add timeline image
  const yPos = 35;
  if (imgHeight + yPos < pageHeight - 20) {
    pdf.addImage(imgData, 'PNG', 15, yPos, imgWidth, imgHeight);
  } else {
    // Scale down if too large
    const scaledHeight = pageHeight - yPos - 20;
    const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
    pdf.addImage(imgData, 'PNG', 15, yPos, scaledWidth, scaledHeight);
  }
  
  // Save PDF
  const timestamp = new Date().toISOString().split('T')[0];
  pdf.save(`${projectName}_Timeline_${eventType}_${timestamp}.pdf`);
}

/**
 * Export all timelines (one page per event type)
 */
export async function exportAllTimelinesToPDF(stateManager: any, observers: any, maxTime: any, projectName = 'SpatialLens') {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  const eventTypes = [
    'pause', 'linger', 'rush', 'walk',
    'scan', 'focus', 'look_up', 'look_down',
    'attend', 'occupy',
    'noticed', 'entered'
  ];
  
  const eventLabels = {
    pause: '⏸ Pause',
    linger: '⏱ Linger',
    rush: '⚡ Rush',
    walk: '🐌 Walk',
    scan: '👀 Scan',
    focus: '🎯 Focus',
    look_up: '⬆️ Look Up',
    look_down: '⬇️ Look Down',
    attend: '👁 Attend',
    occupy: '📦 Occupy',
    noticed: '🔔 Noticed',
    entered: '🚪 Entered'
  };
  
  let isFirstPage = true;
  
  for (const eventType of eventTypes) {
    // Get events for this type
    const timelineData = getTimelineDataForEvent(stateManager, observers, eventType);
    
    if (timelineData.length === 0) continue;
    
    if (!isFirstPage) {
      pdf.addPage();
    }
    isFirstPage = false;
    
    // Add header
    pdf.setFontSize(16);
    pdf.text(`${projectName} - Timeline`, 15, 15);
    pdf.setFontSize(14);
    pdf.text(`${(eventLabels as any)[eventType] || eventType}`, 15, 23);
    pdf.setFontSize(8);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 15, 28);
    pdf.text(`Duration: 0 - ${maxTime.toFixed(2)}s`, pageWidth - 50, 28);
    
    // Draw time scale
    let yPos = 35;
    const timelineWidth = pageWidth - 30;
    const timelineStartX = 60;
    const timelineBarWidth = timelineWidth - 45;
    
    // Time scale markers
    pdf.setFontSize(7);
    pdf.setTextColor(120, 120, 120);
    const numMarkers = 5;
    for (let i = 0; i <= numMarkers; i++) {
      const x = timelineStartX + (i / numMarkers) * timelineBarWidth;
      const time = (i / numMarkers) * maxTime;
      pdf.text(`${time.toFixed(1)}s`, x, yPos, { align: 'center' });
      
      // Draw tick mark
      pdf.setDrawColor(120, 120, 120);
      pdf.line(x, yPos + 1, x, yPos + 3);
    }
    pdf.setTextColor(0, 0, 0);
    
    yPos += 8;
    const timelineHeight = 12;
    
    // Draw timelines for each agent
    for (const item of timelineData) {
      if (yPos + timelineHeight > pageHeight - 15) {
        pdf.addPage();
        
        // Redraw time scale on new page
        yPos = 15;
        pdf.setFontSize(7);
        pdf.setTextColor(120, 120, 120);
        for (let i = 0; i <= numMarkers; i++) {
          const x = timelineStartX + (i / numMarkers) * timelineBarWidth;
          const time = (i / numMarkers) * maxTime;
          pdf.text(`${time.toFixed(1)}s`, x, yPos, { align: 'center' });
          pdf.setDrawColor(120, 120, 120);
          pdf.line(x, yPos + 1, x, yPos + 3);
        }
        pdf.setTextColor(0, 0, 0);
        yPos += 8;
      }
      
      // Agent label
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      let labelY = yPos + 5;
      pdf.text(String(item.agentId), 15, labelY);
      
      if (item.observerId && item.observerId !== 'global') {
        pdf.setFontSize(6);
        pdf.setTextColor(120, 120, 120);
        pdf.text(`${item.observerId}`, 15, labelY + 3);
        pdf.setTextColor(0, 0, 0);
      }
      
      // Timeline bar background
      pdf.setFillColor(240, 240, 240);
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(timelineStartX, yPos, timelineBarWidth, 8, 'FD');
      
      // Draw events as colored blocks
      if (item.events.length > 0) {
        // Color based on event type
        const colors = {
          pause: [100, 100, 255],
          linger: [150, 100, 255],
          rush: [255, 100, 100],
          walk: [100, 200, 100],
          scan: [255, 200, 100],
          focus: [100, 255, 200],
          look_up: [200, 150, 255],
          look_down: [255, 150, 200],
          attend: [100, 200, 255],
          occupy: [255, 180, 100],
          noticed: [255, 255, 100],
          entered: [180, 255, 180]
        };
        
        const color = (colors as any)[eventType] || [68, 136, 255];
        for (const event of item.events) {
          const startX = timelineStartX + ((event.start_time / maxTime) * timelineBarWidth);
          const duration = event.end_time - event.start_time;
          const width = Math.max(0.8, (duration / maxTime) * timelineBarWidth);
          
          // Set fill color for each event block
          pdf.setFillColor(color[0], color[1], color[2]);
          
          // Draw event block
          pdf.rect(startX, yPos + 1, width, 6, 'F');
          
          // Add duration label for longer events (if space allows)
          if (width > 10 && duration > 0.5) {
            pdf.setFontSize(5);
            pdf.setTextColor(255, 255, 255);
            const durationText = duration < 1 ? `${(duration * 1000).toFixed(0)}ms` : `${duration.toFixed(1)}s`;
            pdf.text(durationText, startX + width / 2, yPos + 4.5, { align: 'center' });
            pdf.setTextColor(0, 0, 0);
          }
        }
      }
      
      // Event count and total duration
      const totalDuration = item.events.reduce((sum: number, e: any) => sum + (e.end_time - e.start_time), 0);
      pdf.setFontSize(6);
      pdf.setTextColor(80, 80, 80);
      pdf.text(`${item.events.length} (${totalDuration.toFixed(1)}s)`, timelineStartX + timelineBarWidth + 2, yPos + 5);
      pdf.setTextColor(0, 0, 0);
      
      yPos += timelineHeight;
    }
    
    // Add summary at bottom
    if (yPos + 15 < pageHeight - 10) {
      yPos += 5;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(15, yPos, pageWidth - 15, yPos);
      yPos += 5;
      
      const totalEvents = timelineData.reduce((sum: number, item: any) => sum + item.events.length, 0);
      const totalDuration = timelineData.reduce((sum: number, item: any) => 
        sum + item.events.reduce((s: number, e: any) => s + (e.end_time - e.start_time), 0), 0);
      
      pdf.setFontSize(8);
      pdf.text(`Summary: ${totalEvents} total events, ${totalDuration.toFixed(1)}s cumulative duration`, 15, yPos);
    }
  }
  
  // Save PDF
  const timestamp = new Date().toISOString().split('T')[0];
  pdf.save(`${projectName}_All_Timelines_${timestamp}.pdf`);
}

/**
 * Export insights and formulas to PDF
 */
export async function exportInsightsToPDF(stateManager: any, observers: any, maxTime: any, projectName = 'SpatialLens') {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Title page
  pdf.setFontSize(20);
  pdf.text(`${projectName}`, pageWidth / 2, 30, { align: 'center' });
  pdf.setFontSize(14);
  pdf.text('Spatial Analysis Report', pageWidth / 2, 40, { align: 'center' });
  pdf.setFontSize(10);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 50, { align: 'center' });
  pdf.text(`Analysis Duration: ${maxTime.toFixed(2)} seconds`, pageWidth / 2, 57, { align: 'center' });
  
  // Get all agent IDs
  const agentIds = Array.from(stateManager.completedEvents.keys());
  
  // Summary statistics
  pdf.addPage();
  pdf.setFontSize(16);
  pdf.text('Summary Statistics', 15, 15);
  
  let yPos = 25;
  pdf.setFontSize(10);
  pdf.text(`Total Agents: ${agentIds.length}`, 15, yPos);
  yPos += 7;
  pdf.text(`Total Observers: ${observers.length}`, 15, yPos);
  yPos += 7;
  pdf.text(`Analysis Duration: ${maxTime.toFixed(2)}s`, 15, yPos);
  yPos += 15;
  
  // Event counts per type
  pdf.setFontSize(14);
  pdf.text('Event Counts by Type', 15, yPos);
  yPos += 10;
  
  const eventTypes = [
    'pause', 'linger', 'rush', 'walk',
    'scan', 'focus', 'look_up', 'look_down',
    'attend', 'occupy', 'noticed', 'entered'
  ];
  
  pdf.setFontSize(9);
  for (const eventType of eventTypes) {
    let totalEvents = 0;
    for (const agentId of agentIds) {
      for (const observer of observers) {
        const events = stateManager.getProcessedEvents(agentId, observer.id, eventType) || [];
        totalEvents += events.length;
      }
    }
    
    if (totalEvents > 0) {
      pdf.text(`  ${eventType}: ${totalEvents} events`, 15, yPos);
      yPos += 6;
    }
    
    if (yPos > pageHeight - 20) {
      pdf.addPage();
      yPos = 15;
    }
  }
  
  // Insights per observer
  for (const observer of observers) {
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.text(`Observer: ${observer.name || observer.id}`, 15, 15);
    
    yPos = 25;
    
    // Calculate insights for this observer
    const insights = calculateObserverInsights(stateManager, observer, agentIds, maxTime);
    
    // Architectural Quality Scores
    pdf.setFontSize(14);
    pdf.text('Architectural Quality Scores', 15, yPos);
    yPos += 10;
    
    pdf.setFontSize(10);
    for (const [quality, score] of Object.entries(insights.qualityScores)) {
      const band = getScoreBand(score.score);
      pdf.text(`${quality}: ${score.score.toFixed(2)} (${band})`, 20, yPos);
      yPos += 7;
      
      // Formula
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(score.formula, 25, yPos);
      pdf.setTextColor(0, 0, 0);
      yPos += 6;
      
      if (yPos > pageHeight - 30) {
        pdf.addPage();
        yPos = 15;
      }
    }
    
    yPos += 5;
    
    // Population Ratios
    pdf.setFontSize(14);
    pdf.text('Population Metrics', 15, yPos);
    yPos += 10;
    
    pdf.setFontSize(10);
    for (const [metric, value] of Object.entries(insights.populationRatios)) {
      pdf.text(`${metric}: ${(value * 100).toFixed(1)}%`, 20, yPos);
      yPos += 7;
    }
  }
  
  // Formulas reference page
  pdf.addPage();
  pdf.setFontSize(16);
  pdf.text('Formulas Reference', 15, 15);
  
  yPos = 25;
  const formulas = [
    {
      name: 'Visibility',
      question: 'Can people see it?',
      formula: '0.6×noticed_ratio + 0.4×attend_time_norm'
    },
    {
      name: 'Attraction',
      question: 'Does it draw people?',
      formula: '0.5×entered_ratio + 0.3×avg_dwell_time_norm + 0.2×noticed_ratio'
    },
    {
      name: 'Comfort',
      question: 'Does it support staying?',
      formula: '0.4×avg_time_spent_norm + 0.4×longest_dwell_norm + 0.2×repeat_visit_ratio'
    }
  ];
  
  pdf.setFontSize(12);
  for (const formula of formulas) {
    pdf.text(formula.name, 15, yPos);
    yPos += 6;
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Question: ${formula.question}`, 20, yPos);
    yPos += 5;
    pdf.text(`Formula: ${formula.formula}`, 20, yPos);
    pdf.setTextColor(0, 0, 0);
    yPos += 10;
    pdf.setFontSize(12);
  }
  
  // Add timeline pages for each event type (reuse eventTypes from above)
  const eventLabels = {
    pause: '⏸ Pause',
    linger: '⏱ Linger',
    rush: '⚡ Rush',
    walk: '🐌 Walk',
    scan: '👀 Scan',
    focus: '🎯 Focus',
    look_up: '⬆️ Look Up',
    look_down: '⬇️ Look Down',
    attend: '👁 Attend',
    occupy: '📦 Occupy',
    noticed: '🔔 Noticed',
    entered: '🚪 Entered'
  };
  
  for (const eventType of eventTypes) {
    // Get events for this type
    const timelineData = getTimelineDataForEvent(stateManager, observers, eventType);
    
    if (timelineData.length === 0) continue;
    
    pdf.addPage();
    
    // Add header
    pdf.setFontSize(16);
    pdf.text(`Timeline: ${(eventLabels as any)[eventType] || eventType}`, 15, 15);
    pdf.setFontSize(8);
    pdf.text(`Duration: 0 - ${maxTime.toFixed(2)}s`, pageWidth - 50, 15);
    
    // Draw time scale
    yPos = 25;
    const timelineWidth = pageWidth - 30;
    const timelineStartX = 60;
    const timelineBarWidth = timelineWidth - 45;
    
    // Time scale markers
    pdf.setFontSize(7);
    pdf.setTextColor(120, 120, 120);
    const numMarkers = 5;
    for (let i = 0; i <= numMarkers; i++) {
      const x = timelineStartX + (i / numMarkers) * timelineBarWidth;
      const time = (i / numMarkers) * maxTime;
      pdf.text(`${time.toFixed(1)}s`, x, yPos, { align: 'center' });
      
      // Draw tick mark
      pdf.setDrawColor(120, 120, 120);
      pdf.line(x, yPos + 1, x, yPos + 3);
    }
    pdf.setTextColor(0, 0, 0);
    
    yPos += 8;
    const timelineHeight = 12;
    
    // Draw timelines for each agent
    for (const item of timelineData) {
      if (yPos + timelineHeight > pageHeight - 15) {
        pdf.addPage();
        
        // Redraw time scale on new page
        yPos = 15;
        pdf.setFontSize(7);
        pdf.setTextColor(120, 120, 120);
        for (let i = 0; i <= numMarkers; i++) {
          const x = timelineStartX + (i / numMarkers) * timelineBarWidth;
          const time = (i / numMarkers) * maxTime;
          pdf.text(`${time.toFixed(1)}s`, x, yPos, { align: 'center' });
          pdf.setDrawColor(120, 120, 120);
          pdf.line(x, yPos + 1, x, yPos + 3);
        }
        pdf.setTextColor(0, 0, 0);
        yPos += 8;
      }
      
      // Agent label
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      let labelY = yPos + 5;
      pdf.text(String(item.agentId), 15, labelY);
      
      if (item.observerId && item.observerId !== 'global') {
        pdf.setFontSize(6);
        pdf.setTextColor(120, 120, 120);
        pdf.text(`${item.observerId}`, 15, labelY + 3);
        pdf.setTextColor(0, 0, 0);
      }
      
      // Timeline bar background
      pdf.setFillColor(240, 240, 240);
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(timelineStartX, yPos, timelineBarWidth, 8, 'FD');
      
      // Draw events as colored blocks
      if (item.events.length > 0) {
        // Color based on event type
        const colors = {
          pause: [100, 100, 255],
          linger: [150, 100, 255],
          rush: [255, 100, 100],
          walk: [100, 200, 100],
          scan: [255, 200, 100],
          focus: [100, 255, 200],
          look_up: [200, 150, 255],
          look_down: [255, 150, 200],
          attend: [100, 200, 255],
          occupy: [255, 180, 100],
          noticed: [255, 255, 100],
          entered: [180, 255, 180]
        };
        
        const color = (colors as any)[eventType] || [68, 136, 255];
        
        for (const event of item.events) {
          const startX = timelineStartX + ((event.start_time / maxTime) * timelineBarWidth);
          const duration = event.end_time - event.start_time;
          const width = Math.max(0.8, (duration / maxTime) * timelineBarWidth);
          
          // Set fill color for each event block
          pdf.setFillColor(color[0], color[1], color[2]);
          
          // Draw event block
          pdf.rect(startX, yPos + 1, width, 6, 'F');
          
          // Add duration label for longer events (if space allows)
          if (width > 10 && duration > 0.5) {
            pdf.setFontSize(5);
            pdf.setTextColor(255, 255, 255);
            const durationText = duration < 1 ? `${(duration * 1000).toFixed(0)}ms` : `${duration.toFixed(1)}s`;
            pdf.text(durationText, startX + width / 2, yPos + 4.5, { align: 'center' });
            pdf.setTextColor(0, 0, 0);
          }
        }
      }
      
      // Event count and total duration
      const totalDuration = item.events.reduce((sum: number, e: any) => sum + (e.end_time - e.start_time), 0);
      pdf.setFontSize(6);
      pdf.setTextColor(80, 80, 80);
      pdf.text(`${item.events.length} (${totalDuration.toFixed(1)}s)`, timelineStartX + timelineBarWidth + 2, yPos + 5);
      pdf.setTextColor(0, 0, 0);
      
      yPos += timelineHeight;
    }
    
    // Add summary at bottom
    if (yPos + 15 < pageHeight - 10) {
      yPos += 5;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(15, yPos, pageWidth - 15, yPos);
      yPos += 5;
      
      const totalEvents = timelineData.reduce((sum: number, item: any) => sum + item.events.length, 0);
      const totalDuration = timelineData.reduce((sum: number, item: any) => 
        sum + item.events.reduce((s: number, e: any) => s + (e.end_time - e.start_time), 0), 0);
      
      pdf.setFontSize(8);
      pdf.text(`Summary: ${totalEvents} total events, ${totalDuration.toFixed(1)}s cumulative duration`, 15, yPos);
    }
  }
  
  // Save PDF
  const timestamp = new Date().toISOString().split('T')[0];
  pdf.save(`${projectName}_Insights_Report_${timestamp}.pdf`);
}

/**
 * Export comprehensive report (everything)
 */
export async function exportComprehensiveReport(stateManager: any, observers: any, maxTime: any, projectName = 'SpatialLens') {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Title page
  pdf.setFontSize(20);
  pdf.text(`${projectName}`, pageWidth / 2, 40, { align: 'center' });
  pdf.setFontSize(16);
  pdf.text('Comprehensive Spatial Analysis Report', pageWidth / 2, 50, { align: 'center' });
  pdf.setFontSize(10);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 60, { align: 'center' });
  
  // Get all agent IDs
  const agentIds = Array.from(stateManager.completedEvents.keys());
  
  // Executive Summary
  pdf.addPage();
  pdf.setFontSize(16);
  pdf.text('Executive Summary', 15, 15);
  
  let yPos = 25;
  pdf.setFontSize(10);
  pdf.text(`Analysis Period: ${maxTime.toFixed(2)} seconds`, 15, yPos);
  yPos += 7;
  pdf.text(`Number of Agents: ${agentIds.length}`, 15, yPos);
  yPos += 7;
  pdf.text(`Number of Observers: ${observers.length}`, 15, yPos);
  yPos += 15;
  
  // Event Types Overview
  pdf.setFontSize(14);
  pdf.text('Event Types', 15, yPos);
  yPos += 8;
  
  const eventDescriptions = {
    pause: 'Agent standing still',
    linger: 'Agent staying in small area',
    rush: 'Agent moving quickly',
    walk: 'Agent walking normally',
    scan: 'Agent rapidly looking around',
    focus: 'Agent focusing on something',
    look_up: 'Agent looking upward',
    look_down: 'Agent looking downward',
    attend: 'Agent looking at observer',
    occupy: 'Agent inside observer area',
    noticed: 'First time agent noticed observer',
    entered: 'First time agent entered observer'
  };
  
  pdf.setFontSize(9);
  for (const [type, description] of Object.entries(eventDescriptions)) {
    pdf.text(`• ${type}: ${description}`, 20, yPos);
    yPos += 5;
    if (yPos > pageHeight - 20) {
      pdf.addPage();
      yPos = 15;
    }
  }
  
  // Insights for each observer
  for (const observer of observers) {
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.text(`Observer Analysis: ${observer.name || observer.id}`, 15, 15);
    
    yPos = 25;
    
    const insights = calculateObserverInsights(stateManager, observer, agentIds, maxTime);
    
    // Quality Scores
    pdf.setFontSize(14);
    pdf.text('Architectural Quality Scores', 15, yPos);
    yPos += 10;
    
    pdf.setFontSize(10);
    for (const [quality, score] of Object.entries(insights.qualityScores)) {
      const band = getScoreBand(score.score);
      pdf.text(`${quality}: ${score.score.toFixed(2)} (${band})`, 20, yPos);
      yPos += 6;
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(score.formula, 25, yPos);
      pdf.setTextColor(0, 0, 0);
      yPos += 7;
      pdf.setFontSize(10);
    }
    
    yPos += 5;
    
    // Population metrics
    pdf.setFontSize(14);
    pdf.text('Population Metrics', 15, yPos);
    yPos += 10;
    
    pdf.setFontSize(10);
    for (const [metric, value] of Object.entries(insights.populationRatios)) {
      pdf.text(`${metric}: ${(value * 100).toFixed(1)}%`, 20, yPos);
      yPos += 6;
    }
  }
  
  // Timeline pages
  const eventTypes = [
    'pause', 'linger', 'rush', 'walk',
    'scan', 'focus', 'look_up', 'look_down',
    'attend', 'occupy', 'noticed', 'entered'
  ];
  
  const eventLabels = {
    pause: '⏸ Pause',
    linger: '⏱ Linger',
    rush: '⚡ Rush',
    walk: '🐌 Walk',
    scan: '👀 Scan',
    focus: '🎯 Focus',
    look_up: '⬆️ Look Up',
    look_down: '⬇️ Look Down',
    attend: '👁 Attend',
    occupy: '📦 Occupy',
    noticed: '🔔 Noticed',
    entered: '🚪 Entered'
  };
  
  for (const eventType of eventTypes) {
    const timelineData = getTimelineDataForEvent(stateManager, observers, eventType);
    
    if (timelineData.length === 0) continue;
    
    pdf.addPage();
    
    // Add header
    pdf.setFontSize(16);
    pdf.text(`Timeline: ${(eventLabels as any)[eventType] || eventType}`, 15, 15);
    pdf.setFontSize(8);
    pdf.text(`Duration: 0 - ${maxTime.toFixed(2)}s`, pageWidth - 50, 15);
    
    // Draw timeline
    yPos = 25;
    const timelineHeight = 15;
    const timelineWidth = pageWidth - 30;
    
    for (const item of timelineData) {
      if (yPos + timelineHeight > pageHeight - 10) {
        pdf.addPage();
        yPos = 15;
      }
      
      // Agent label
      pdf.setFontSize(9);
      pdf.text(String(item.agentId), 15, yPos + 3);
      
      if (item.observerId) {
        pdf.setFontSize(7);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`(${item.observerId})`, 15, yPos + 7);
        pdf.setTextColor(0, 0, 0);
      }
      
      // Timeline bar background
      pdf.setFillColor(50, 50, 50);
      pdf.rect(60, yPos, timelineWidth - 45, 10, 'F');
      
      // Draw events
      pdf.setFillColor(68, 136, 255);
      for (const event of item.events) {
        const startX = 60 + ((event.start_time / maxTime) * (timelineWidth - 45));
        const width = Math.max(0.5, ((event.end_time - event.start_time) / maxTime) * (timelineWidth - 45));
        pdf.rect(startX, yPos + 1, width, 8, 'F');
      }
      
      // Event count
      pdf.setFontSize(7);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`${item.events.length}`, pageWidth - 15, yPos + 6, { align: 'right' });
      pdf.setTextColor(0, 0, 0);
      
      yPos += timelineHeight;
    }
  }
  
  // Save PDF
  const timestamp = new Date().toISOString().split('T')[0];
  pdf.save(`${projectName}_Comprehensive_Report_${timestamp}.pdf`);
}

/**
 * Helper: Get timeline data for a specific event type
 */
function getTimelineDataForEvent(stateManager: any, observers: any, eventType: any) {
  const agentIds = Array.from(stateManager.completedEvents.keys());
  const data = [];
  
  const pointEventTypes = ['noticed', 'entered'];
  const isPointEvent = pointEventTypes.includes(eventType);
  
  for (const agentId of agentIds) {
    // For object-related events (attend, occupy, noticed, entered)
    if (['attend', 'occupy', 'noticed', 'entered'].includes(eventType)) {
      for (const observer of observers) {
        const events = stateManager.getProcessedEvents(agentId, observer.id, eventType) || [];
        if (events.length > 0) {
          data.push({
            agentId,
            observerId: observer.name || observer.id,
            events: isPointEvent ? events.map((e: any) => ({ ...e, end_time: e.start_time + 0.1 })) : events
          });
        }
      }
    } else {
      // For non-object events (movement, orientation)
      const events = stateManager.getProcessedEvents(agentId, 'global', eventType) || [];
      if (events.length > 0) {
        data.push({
          agentId,
          observerId: null,
          events
        });
      }
    }
  }
  
  return data;
}

/**
 * Helper: Calculate insights for an observer
 */
function calculateObserverInsights(stateManager: any, observer: any, agentIds: any, maxTime: any) {
  // Import calculations from the calculations utility
  let noticed = 0, entered = 0;
  let totalAttendTime = 0, totalOccupyTime = 0;
  const agentDwellTimes = [];
  
  for (const agentId of agentIds) {
    const noticedEvents = stateManager.getRawEvents(agentId, observer.id, 'noticed') || [];
    const enteredEvents = stateManager.getRawEvents(agentId, observer.id, 'entered') || [];
    const attendEvents = stateManager.getProcessedEvents(agentId, observer.id, 'attend') || [];
    const occupyEvents = stateManager.getProcessedEvents(agentId, observer.id, 'occupy') || [];
    
    if (noticedEvents.length > 0) noticed++;
    if (enteredEvents.length > 0) entered++;
    
    const attendTime = attendEvents.reduce((sum: number, e: any) => sum + (e.end_time - e.start_time), 0);
    const occupyTime = occupyEvents.reduce((sum: number, e: any) => sum + (e.end_time - e.start_time), 0);
    
    totalAttendTime += attendTime;
    totalOccupyTime += occupyTime;
    
    if (occupyTime > 0) {
      agentDwellTimes.push(occupyTime);
    }
  }
  
  const totalAgents = agentIds.length;
  const noticed_ratio = totalAgents > 0 ? noticed / totalAgents : 0;
  const entered_ratio = totalAgents > 0 ? entered / totalAgents : 0;
  const attend_time_norm = Math.min(1, totalAttendTime / (maxTime * totalAgents));
  
  const avg_dwell_time = agentDwellTimes.length > 0
    ? agentDwellTimes.reduce((a, b) => a + b, 0) / agentDwellTimes.length
    : 0;
  const avg_dwell_time_norm = Math.min(1, avg_dwell_time / maxTime);
  
  const longest_dwell = agentDwellTimes.length > 0 ? Math.max(...agentDwellTimes) : 0;
  const longest_dwell_norm = Math.min(1, longest_dwell / maxTime);
  
  const repeat_visit_ratio = 0; // Simplified for now
  
  const avg_time_spent = totalOccupyTime / totalAgents;
  const avg_time_spent_norm = Math.min(1, avg_time_spent / maxTime);
  
  // Calculate quality scores
  const visibility = 0.6 * noticed_ratio + 0.4 * attend_time_norm;
  const attraction = 0.5 * entered_ratio + 0.3 * avg_dwell_time_norm + 0.2 * noticed_ratio;
  const comfort = 0.4 * avg_time_spent_norm + 0.4 * longest_dwell_norm + 0.2 * repeat_visit_ratio;
  
  return {
    populationRatios: {
      noticed_ratio,
      entered_ratio,
      attend_time_ratio: attend_time_norm,
      occupy_time_ratio: totalOccupyTime / (maxTime * totalAgents)
    },
    qualityScores: {
      Visibility: {
        score: visibility,
        formula: '0.6×noticed_ratio + 0.4×attend_time_norm'
      },
      Attraction: {
        score: attraction,
        formula: '0.5×entered_ratio + 0.3×avg_dwell_time_norm + 0.2×noticed_ratio'
      },
      Comfort: {
        score: comfort,
        formula: '0.4×avg_time_spent_norm + 0.4×longest_dwell_norm + 0.2×repeat_visit_ratio'
      }
    }
  };
}

/**
 * Helper: Get score band
 */
function getScoreBand(score: any) {
  if (score >= 0.8) return 'Excellent';
  if (score >= 0.6) return 'Good';
  if (score >= 0.4) return 'Fair';
  if (score >= 0.2) return 'Poor';
  return 'Very Poor';
}
