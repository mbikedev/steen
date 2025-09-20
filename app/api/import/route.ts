import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const fileName = file.name.toLowerCase()
    const fileBuffer = await file.arrayBuffer()
    let parsedData: any[] = []

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // Parse Excel file
      const workbook = XLSX.read(fileBuffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      // Skip header row if it exists and convert to resident objects
      const headers = jsonData[0] as string[]
      const rows = jsonData.slice(1) as any[][]
      
      parsedData = rows
        .filter(row => row.length > 0 && row.some(cell => cell != null && cell !== ''))
        .map((row, index) => {
          const resident: any = {}
          
          // Map columns to resident fields (adjust column mapping as needed)
          headers.forEach((header, i) => {
            const value = row[i]
            if (value != null && value !== '') {
              const normalizedHeader = header.toString().toLowerCase().trim()
              
              // Map common column names to resident fields
              if (normalizedHeader.includes('badge') || normalizedHeader.includes('nummer')) {
                resident.badge = parseInt(value) || value
              } else if (normalizedHeader.includes('voornaam') || normalizedHeader.includes('first') || normalizedHeader.includes('naam') && !normalizedHeader.includes('achter')) {
                resident.firstName = value.toString().trim()
              } else if (normalizedHeader.includes('achternaam') || normalizedHeader.includes('last') || normalizedHeader.includes('surname')) {
                resident.lastName = value.toString().trim()
              } else if (normalizedHeader.includes('kamer') || normalizedHeader.includes('room')) {
                resident.room = value.toString().trim()
              } else if (normalizedHeader.includes('nationaliteit') || normalizedHeader.includes('nationality')) {
                resident.nationality = value.toString().trim()
              } else if (normalizedHeader.includes('ov') && normalizedHeader.includes('nummer')) {
                resident.ovNumber = value.toString().trim()
              } else if (normalizedHeader.includes('register')) {
                resident.registerNumber = value.toString().trim()
              } else if (normalizedHeader.includes('geboortedatum') || normalizedHeader.includes('birth')) {
                resident.dateOfBirth = value
              } else if (normalizedHeader.includes('leeftijd') || normalizedHeader.includes('age')) {
                resident.age = parseInt(value) || null
              } else if (normalizedHeader.includes('geslacht') || normalizedHeader.includes('gender')) {
                resident.gender = value.toString().trim()
              } else if (normalizedHeader.includes('contact') || normalizedHeader.includes('reference')) {
                resident.referencePerson = value.toString().trim()
              } else if (normalizedHeader.includes('inschrijf') || normalizedHeader.includes('date') && normalizedHeader.includes('in')) {
                resident.dateIn = value
              } else if (normalizedHeader.includes('status')) {
                resident.status = value.toString().trim()
              } else if (normalizedHeader.includes('opmerking') || normalizedHeader.includes('remarks')) {
                resident.remarks = value.toString().trim()
              }
            }
          })
          
          return resident
        })
        .filter(resident => resident.badge || resident.firstName || resident.lastName)

    } else if (fileName.endsWith('.pdf')) {
      // Parse PDF file - dynamically import to avoid build issues
      const pdf = (await import('pdf-parse')).default as any
      const pdfData = await pdf(Buffer.from(fileBuffer))
      const text = pdfData.text
      
      // Simple text parsing for resident data
      // This is a basic implementation - you might need to adjust based on PDF format
      const lines = text.split('\n').filter((line: string) => line.trim().length > 0)
      
      // Try to extract resident information from PDF text
      // This assumes a specific format - adjust based on your PDF structure
      const residents: any[] = []
      let currentResident: any = {}
      
      for (const line of lines) {
        const trimmedLine = line.trim()
        
        // Look for patterns that indicate resident data
        if (/badge\s*[:]\s*(\d+)/i.test(trimmedLine)) {
          if (Object.keys(currentResident).length > 0) {
            residents.push(currentResident)
          }
          currentResident = { badge: parseInt(trimmedLine.match(/badge\s*[:]\s*(\d+)/i)?.[1] || '0') }
        } else if (/naam\s*[:]\s*(.+)/i.test(trimmedLine)) {
          const nameMatch = trimmedLine.match(/naam\s*[:]\s*(.+)/i)
          if (nameMatch) {
            const fullName = nameMatch[1].trim()
            const nameParts = fullName.split(' ')
            currentResident.firstName = nameParts[0]
            currentResident.lastName = nameParts.slice(1).join(' ')
          }
        } else if (/kamer\s*[:]\s*(.+)/i.test(trimmedLine)) {
          const roomMatch = trimmedLine.match(/kamer\s*[:]\s*(.+)/i)
          if (roomMatch) {
            currentResident.room = roomMatch[1].trim()
          }
        } else if (/nationaliteit\s*[:]\s*(.+)/i.test(trimmedLine)) {
          const nationalityMatch = trimmedLine.match(/nationaliteit\s*[:]\s*(.+)/i)
          if (nationalityMatch) {
            currentResident.nationality = nationalityMatch[1].trim()
          }
        }
      }
      
      // Add the last resident if exists
      if (Object.keys(currentResident).length > 0) {
        residents.push(currentResident)
      }
      
      parsedData = residents.filter(resident => resident.badge || resident.firstName)
    } else {
      return NextResponse.json(
        { error: 'Unsupported file format. Please upload .xlsx, .xls, or .pdf files.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
      count: parsedData.length,
      fileType: fileName.endsWith('.pdf') ? 'pdf' : 'excel'
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to process file. Please check the file format and try again.' },
      { status: 500 }
    )
  }
}