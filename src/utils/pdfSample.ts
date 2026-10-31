// Helper to generate clean, valid base64 PDF documents for demo and fallback purposes
export function generateSamplePdfBase64(title: string, subtitle: string, items: string[] = []): string {
  const lines: string[] = [
    `BT`,
    `/F1 18 Tf`,
    `50 780 Td`,
    `(${title}) Tj`,
    `/F1 12 Tf`,
    `0 -30 Td`,
    `(${subtitle}) Tj`,
    `0 -20 Td`,
    `(${'='.repeat(55)}) Tj`,
    `0 -25 Td`
  ];

  items.forEach((item) => {
    lines.push(`/F1 11 Tf`);
    lines.push(`(${item}) Tj`);
    lines.push(`0 -20 Td`);
  });

  lines.push(`0 -40 Td`);
  lines.push(`/F1 9 Tf`);
  lines.push(`(THAI SANKO CO., LTD. - OFFICIAL TRANSPORT ANNOUNCEMENT) Tj`);
  lines.push(`ET`);

  const content = lines.join('\n');
  const streamLen = content.length;

  const pdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> /Contents 4 0 R >> endobj
4 0 obj << /Length ${streamLen} >>
stream
${content}
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000280 00000 n 
trailer << /Size 5 /Root 1 0 R >>
startxref
${350 + streamLen}
%%EOF`;

  // Encode to base64 safely in browser or node
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return `data:application/pdf;base64,${window.btoa(unescape(encodeURIComponent(pdf)))}`;
  }
  return `data:application/pdf;base64,${Buffer.from(pdf).toString('base64')}`;
}

export const SAMPLE_SCHEDULE_PDF = generateSamplePdfBase64(
  'THAI SANKO CO., LTD. - SHUTTLE BUS SERVICE',
  'Holiday Shuttle Schedule & Monthly Maintenance Plan (September 2026)',
  [
    '1. Morning Shift (Route A): 06:40 Departure from City Center to Plant 1',
    '2. Evening Regular Shift (Route A & B): 17:20 Departure from Main Canteen',
    '3. Overtime Shift (OT 1): 20:10 Departure from Plant 1 Gate 2',
    '4. Night Shift (OT 2): 08:10 Departure from Terminal Hub',
    '5. Maintenance Notice: Vehicle SK-04 scheduled for brake and tire inspection on Friday',
    '6. Contact Administration Desk at Ext. 1420 for special transportation requests'
  ]
);

export const SAMPLE_SAFETY_PDF = generateSamplePdfBase64(
  'THAI SANKO CO., LTD. - SAFETY REGULATIONS',
  'Safety Manual & Guidelines for Employee Shuttle Bus Passengers',
  [
    'Rule 1: All passengers must book their seat via the web portal at least 1 hour in advance.',
    'Rule 2: Present your digital E-Ticket QR/Pass to the driver before boarding.',
    'Rule 3: Fasten your safety belt immediately upon taking your seat.',
    'Rule 4: Strictly no pungent food or open beverages permitted in the passenger cabin.',
    'Rule 5: Keep emergency exit doors and aisles clear of bags and personal belongings.',
    'Rule 6: If unable to travel, cancel your booking in the app to release the seat for colleagues.'
  ]
);

export const SAMPLE_ROUTE_PDF = generateSamplePdfBase64(
  'THAI SANKO CO., LTD. - ROUTE ADJUSTMENT NOTICE',
  'Route A & Route B Timetable Update Effective October 1, 2026',
  [
    'Route A: Adjusting departure to 17:20 to avoid external main road bottleneck.',
    'Route B: Added new stop at Canteen Building 3 for warehouse logistics staff.',
    'Driver dispatch and vehicle contact numbers are listed on the administration portal.',
    'For emergency delay notifications, check the real-time News and Notice banner.'
  ]
);
