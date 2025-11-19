

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import ExcelJS from "exceljs"
import pptxgen from "pptxgenjs"
import { Document as DocxDocument, Packer, Paragraph, TextRun, Table, TableCell, TableRow, AlignmentType, HeadingLevel } from "docx"
import PDFDocument from "pdfkit"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'excel'
    const name = searchParams.get('name') || 'Atlas_Template'
    const templateCategory = searchParams.get('category') || ''

    // Generate template based on type
    let buffer: Buffer
    let contentType: string
    let filename: string

    switch (type.toLowerCase()) {
      case 'excel':
        buffer = await generateExcelTemplate(name, templateCategory)
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        filename = `${name}.xlsx`
        break
      
      case 'powerpoint':
      case 'pptx':
        buffer = await generatePowerPointTemplate(name, templateCategory)
        contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        filename = `${name}.pptx`
        break
      
      case 'word':
      case 'docx':
        buffer = await generateWordTemplate(name, templateCategory)
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        filename = `${name}.docx`
        break
      
      case 'pdf':
        buffer = await generatePDFTemplate(name, templateCategory)
        contentType = 'application/pdf'
        filename = `${name}.pdf`
        break
      
      default:
        return NextResponse.json({ error: "Invalid template type" }, { status: 400 })
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString()
      }
    })

  } catch (error) {
    console.error("Template generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate template" }, 
      { status: 500 }
    )
  }
}

// Generate Excel Template
async function generateExcelTemplate(name: string, category: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  
  // Determine template content based on name/category
  if (name.toLowerCase().includes('sprint') || name.toLowerCase().includes('planning')) {
    const worksheet = workbook.addWorksheet('Sprint Planning')
    
    // Header
    worksheet.mergeCells('A1:G1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = 'Sprint Planning Template'
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0070C0' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getRow(1).height = 30
    
    // Sprint Info
    worksheet.getCell('A3').value = 'Sprint Number:'
    worksheet.getCell('B3').value = '[Enter Sprint #]'
    worksheet.getCell('A4').value = 'Sprint Goal:'
    worksheet.getCell('B4').value = '[Enter Sprint Goal]'
    worksheet.getCell('A5').value = 'Start Date:'
    worksheet.getCell('B5').value = '[MM/DD/YYYY]'
    worksheet.getCell('A6').value = 'End Date:'
    worksheet.getCell('B6').value = '[MM/DD/YYYY]'
    
    // Column headers for backlog
    worksheet.getCell('A8').value = 'Story ID'
    worksheet.getCell('B8').value = 'User Story'
    worksheet.getCell('C8').value = 'Story Points'
    worksheet.getCell('D8').value = 'Priority'
    worksheet.getCell('E8').value = 'Assigned To'
    worksheet.getCell('F8').value = 'Status'
    worksheet.getCell('G8').value = 'Notes'
    
    // Style headers
    const headerRow = worksheet.getRow(8)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } }
    headerRow.alignment = { horizontal: 'center' }
    headerRow.height = 20
    
    // Sample rows
    const sampleData = [
      ['US-001', 'As a user, I want to...', '5', 'High', 'Team Member', 'To Do', ''],
      ['US-002', 'As a product owner, I need to...', '3', 'Medium', 'Team Member', 'To Do', ''],
      ['US-003', 'As a developer, I want to...', '8', 'High', 'Team Member', 'To Do', '']
    ]
    
    sampleData.forEach((row, idx) => {
      worksheet.addRow(row)
    })
    
    // Column widths
    worksheet.getColumn('A').width = 12
    worksheet.getColumn('B').width = 50
    worksheet.getColumn('C').width = 15
    worksheet.getColumn('D').width = 12
    worksheet.getColumn('E').width = 20
    worksheet.getColumn('F').width = 15
    worksheet.getColumn('G').width = 30
    
    // Add borders
    for (let i = 8; i <= 11; i++) {
      for (let j = 1; j <= 7; j++) {
        const cell = worksheet.getRow(i).getCell(j)
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      }
    }
    
  } else if (name.toLowerCase().includes('velocity') || name.toLowerCase().includes('tracking')) {
    const worksheet = workbook.addWorksheet('Velocity Tracking')
    
    // Header
    worksheet.mergeCells('A1:E1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = 'Team Velocity Tracking'
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0070C0' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getRow(1).height = 30
    
    // Column headers
    worksheet.getCell('A3').value = 'Sprint'
    worksheet.getCell('B3').value = 'Planned Points'
    worksheet.getCell('C3').value = 'Completed Points'
    worksheet.getCell('D3').value = 'Velocity'
    worksheet.getCell('E3').value = 'Notes'
    
    const headerRow = worksheet.getRow(3)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } }
    headerRow.alignment = { horizontal: 'center' }
    
    // Sample data
    for (let i = 1; i <= 6; i++) {
      worksheet.addRow([`Sprint ${i}`, '', '', '', ''])
    }
    
    worksheet.getColumn('A').width = 15
    worksheet.getColumn('B').width = 18
    worksheet.getColumn('C').width = 20
    worksheet.getColumn('D').width = 15
    worksheet.getColumn('E').width = 40
    
  } else {
    // Generic backlog template
    const worksheet = workbook.addWorksheet('User Stories')
    
    worksheet.mergeCells('A1:F1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = name || 'Agile Template'
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0070C0' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    worksheet.getRow(1).height = 30
    
    worksheet.getCell('A3').value = 'ID'
    worksheet.getCell('B3').value = 'User Story'
    worksheet.getCell('C3').value = 'Acceptance Criteria'
    worksheet.getCell('D3').value = 'Story Points'
    worksheet.getCell('E3').value = 'Priority'
    worksheet.getCell('F3').value = 'Status'
    
    const headerRow = worksheet.getRow(3)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } }
    
    worksheet.getColumn('A').width = 10
    worksheet.getColumn('B').width = 50
    worksheet.getColumn('C').width = 50
    worksheet.getColumn('D').width = 15
    worksheet.getColumn('E').width = 12
    worksheet.getColumn('F').width = 15
  }
  
  return await workbook.xlsx.writeBuffer() as Buffer
}

// Generate PowerPoint Template
async function generatePowerPointTemplate(name: string, category: string): Promise<Buffer> {
  const pres = new pptxgen()
  
  // Set presentation properties
  pres.layout = 'LAYOUT_WIDE'
  pres.author = 'Atlas Maximus'
  pres.title = name || 'Agile Presentation'
  
  // Title Slide
  const titleSlide = pres.addSlide()
  titleSlide.background = { color: '0070C0' }
  titleSlide.addText(name || 'Agile Template', {
    x: 0.5,
    y: 2.5,
    w: 9,
    h: 1.5,
    fontSize: 44,
    bold: true,
    color: 'FFFFFF',
    align: 'center'
  })
  titleSlide.addText('Created by Atlas Maximus', {
    x: 0.5,
    y: 4,
    w: 9,
    h: 0.5,
    fontSize: 18,
    color: 'FFFFFF',
    align: 'center'
  })
  
  // Content slide - depends on template type
  if (name.toLowerCase().includes('retrospective') || name.toLowerCase().includes('retro')) {
    const slide2 = pres.addSlide()
    slide2.addText('Sprint Retrospective', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.8,
      fontSize: 32,
      bold: true,
      color: '0070C0'
    })
    
    const retroData = [
      [{ text: 'What went well?' }, { text: '- Team collaboration\n- Met sprint goal\n- Good velocity' }],
      [{ text: 'What could be improved?' }, { text: '- Code review process\n- Testing coverage\n- Communication' }],
      [{ text: 'Action Items' }, { text: '- Implement pair programming\n- Add automated tests\n- Daily stand-up at 9am' }]
    ]
    
    slide2.addTable(retroData, {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 3.5,
      fontSize: 16,
      border: { pt: 1, color: '0070C0' },
      fill: { color: 'F2F2F2' }
    })
    
  } else if (name.toLowerCase().includes('sprint') || name.toLowerCase().includes('planning')) {
    const slide2 = pres.addSlide()
    slide2.addText('Sprint Planning', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.8,
      fontSize: 32,
      bold: true,
      color: '0070C0'
    })
    
    const planningData = [
      [{ text: 'Sprint Goal:' }, { text: 'Implement user authentication and profile management' }],
      [{ text: 'Duration:' }, { text: '2 weeks (10 business days)' }],
      [{ text: 'Team Capacity:' }, { text: '80 story points' }],
      [{ text: 'Key Stories:' }, { text: 'US-001, US-002, US-003, US-004' }]
    ]
    
    slide2.addTable(planningData, {
      x: 0.5,
      y: 1.5,
      w: 9,
      fontSize: 18,
      border: { pt: 1, color: '0070C0' }
    })
    
  } else {
    // Generic Agile Principles slide
    const slide2 = pres.addSlide()
    slide2.addText('Agile Principles', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.8,
      fontSize: 32,
      bold: true,
      color: '0070C0'
    })
    
    slide2.addText([
      { text: '✓ ', options: { fontSize: 20, color: '00B050' } },
      { text: 'Individuals and interactions over processes and tools\n', options: { fontSize: 16 } },
      { text: '✓ ', options: { fontSize: 20, color: '00B050' } },
      { text: 'Working software over comprehensive documentation\n', options: { fontSize: 16 } },
      { text: '✓ ', options: { fontSize: 20, color: '00B050' } },
      { text: 'Customer collaboration over contract negotiation\n', options: { fontSize: 16 } },
      { text: '✓ ', options: { fontSize: 20, color: '00B050' } },
      { text: 'Responding to change over following a plan', options: { fontSize: 16 } }
    ], {
      x: 1,
      y: 1.5,
      w: 8,
      h: 3
    })
  }
  
  // Thank you slide
  const lastSlide = pres.addSlide()
  lastSlide.background = { color: 'F2F2F2' }
  lastSlide.addText('Thank You!', {
    x: 0.5,
    y: 2.5,
    w: 9,
    h: 1,
    fontSize: 40,
    bold: true,
    color: '0070C0',
    align: 'center'
  })
  
  return await pres.write({ outputType: 'nodebuffer' }) as Buffer
}

// Generate Word Template
async function generateWordTemplate(name: string, category: string): Promise<Buffer> {
  const doc = new DocxDocument({
    sections: [{
      properties: {},
      children: [
        // Title
        new Paragraph({
          text: name || 'Agile Template',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),
        
        new Paragraph({
          text: 'Created by Atlas Maximus',
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 }
        }),
        
        // Content based on template type
        new Paragraph({
          text: name.toLowerCase().includes('dod') || name.toLowerCase().includes('definition') 
            ? 'Definition of Done Checklist' 
            : name.toLowerCase().includes('retrospective')
            ? 'Sprint Retrospective Template'
            : 'User Story Template',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        }),
        
        ...(name.toLowerCase().includes('dod') || name.toLowerCase().includes('definition')
          ? [
              new Paragraph({
                text: 'Code Quality:',
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 }
              }),
              new Paragraph({
                text: '☐ Code reviewed and approved',
                spacing: { before: 100, after: 50 }
              }),
              new Paragraph({
                text: '☐ Unit tests written and passing',
                spacing: { after: 50 }
              }),
              new Paragraph({
                text: '☐ Code coverage meets team standards',
                spacing: { after: 50 }
              }),
              new Paragraph({
                text: '☐ No critical bugs or security issues',
                spacing: { after: 200 }
              }),
              
              new Paragraph({
                text: 'Documentation:',
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 }
              }),
              new Paragraph({
                text: '☐ Code comments are clear and helpful',
                spacing: { after: 50 }
              }),
              new Paragraph({
                text: '☐ API documentation updated',
                spacing: { after: 50 }
              }),
              new Paragraph({
                text: '☐ User documentation updated',
                spacing: { after: 200 }
              }),
              
              new Paragraph({
                text: 'Testing:',
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 }
              }),
              new Paragraph({
                text: '☐ Acceptance criteria met',
                spacing: { after: 50 }
              }),
              new Paragraph({
                text: '☐ Integration tests passing',
                spacing: { after: 50 }
              }),
              new Paragraph({
                text: '☐ Regression testing completed',
                spacing: { after: 50 }
              })
            ]
          : name.toLowerCase().includes('retrospective')
          ? [
              new Paragraph({
                text: 'What went well?',
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 }
              }),
              new Paragraph({
                text: '• [Add positive observations here]',
                spacing: { after: 100 }
              }),
              
              new Paragraph({
                text: 'What could be improved?',
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 }
              }),
              new Paragraph({
                text: '• [Add areas for improvement here]',
                spacing: { after: 100 }
              }),
              
              new Paragraph({
                text: 'Action Items:',
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 }
              }),
              new Paragraph({
                text: '• [Add specific action items with owners and due dates]',
                spacing: { after: 100 }
              })
            ]
          : [
              new Paragraph({
                text: 'User Story Format:',
                spacing: { before: 200, after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'As a [type of user], I want [goal/desire] so that [benefit/value].',
                    italics: true
                  })
                ],
                spacing: { after: 200 }
              }),
              
              new Paragraph({
                text: 'Example:',
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 }
              }),
              new Paragraph({
                text: 'As a registered user, I want to reset my password via email so that I can regain access to my account if I forget my credentials.',
                spacing: { after: 200 }
              }),
              
              new Paragraph({
                text: 'Acceptance Criteria:',
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 }
              }),
              new Paragraph({
                text: '• Given [context], when [action], then [outcome]',
                spacing: { after: 50 }
              }),
              new Paragraph({
                text: '• [Add more criteria as needed]',
                spacing: { after: 100 }
              })
            ]
        )
      ]
    }]
  })
  
  return await Packer.toBuffer(doc)
}

// Generate PDF Template
async function generatePDFTemplate(name: string, category: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks: Buffer[] = []
    
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
    
    // Title
    doc.fontSize(24)
       .fillColor('#0070C0')
       .text(name || 'Agile Template', { align: 'center' })
       .moveDown()
    
    doc.fontSize(12)
       .fillColor('#666666')
       .text('Created by Atlas Maximus', { align: 'center' })
       .moveDown(2)
    
    // Content
    doc.fillColor('#000000')
    
    if (name.toLowerCase().includes('dod') || name.toLowerCase().includes('definition')) {
      doc.fontSize(18)
         .fillColor('#0070C0')
         .text('Definition of Done Checklist')
         .moveDown()
      
      doc.fontSize(14)
         .fillColor('#0070C0')
         .text('Code Quality:')
         .moveDown(0.5)
      
      doc.fontSize(12)
         .fillColor('#000000')
         .text('☐ Code reviewed and approved')
         .text('☐ Unit tests written and passing')
         .text('☐ Code coverage meets team standards')
         .text('☐ No critical bugs or security issues')
         .moveDown()
      
      doc.fontSize(14)
         .fillColor('#0070C0')
         .text('Documentation:')
         .moveDown(0.5)
      
      doc.fontSize(12)
         .fillColor('#000000')
         .text('☐ Code comments are clear')
         .text('☐ API documentation updated')
         .text('☐ User documentation updated')
         .moveDown()
      
      doc.fontSize(14)
         .fillColor('#0070C0')
         .text('Testing:')
         .moveDown(0.5)
      
      doc.fontSize(12)
         .fillColor('#000000')
         .text('☐ Acceptance criteria met')
         .text('☐ Integration tests passing')
         .text('☐ Regression testing completed')
         
    } else if (name.toLowerCase().includes('retrospective')) {
      doc.fontSize(18)
         .fillColor('#0070C0')
         .text('Sprint Retrospective Template')
         .moveDown()
      
      doc.fontSize(14)
         .fillColor('#0070C0')
         .text('What went well?')
         .moveDown(0.5)
      
      doc.fontSize(12)
         .fillColor('#000000')
         .text('• [Add positive observations here]')
         .moveDown()
      
      doc.fontSize(14)
         .fillColor('#0070C0')
         .text('What could be improved?')
         .moveDown(0.5)
      
      doc.fontSize(12)
         .fillColor('#000000')
         .text('• [Add areas for improvement here]')
         .moveDown()
      
      doc.fontSize(14)
         .fillColor('#0070C0')
         .text('Action Items:')
         .moveDown(0.5)
      
      doc.fontSize(12)
         .fillColor('#000000')
         .text('• [Add specific action items with owners and due dates]')
         
    } else {
      doc.fontSize(18)
         .fillColor('#0070C0')
         .text('User Story Template')
         .moveDown()
      
      doc.fontSize(12)
         .fillColor('#000000')
         .text('Format:', { continued: false })
         .moveDown(0.5)
      
      doc.fontSize(11)
         .fillColor('#666666')
         .text('As a [type of user], I want [goal/desire] so that [benefit/value].')
         .moveDown()
      
      doc.fontSize(12)
         .fillColor('#000000')
         .text('Example:')
         .moveDown(0.5)
      
      doc.fontSize(11)
         .text('As a registered user, I want to reset my password via email so that I can regain access to my account.')
         .moveDown()
      
      doc.fontSize(12)
         .text('Acceptance Criteria:')
         .moveDown(0.5)
      
      doc.fontSize(11)
         .text('• Given [context], when [action], then [outcome]')
         .text('• [Add more criteria as needed]')
    }
    
    // Footer
    doc.fontSize(10)
       .fillColor('#999999')
       .text(
         `Generated on ${new Date().toLocaleDateString()}`,
         50,
         doc.page.height - 50,
         { align: 'center' }
       )
    
    doc.end()
  })
}
