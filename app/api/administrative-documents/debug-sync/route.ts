import { NextRequest, NextResponse } from 'next/server'
import { apiService } from '@/lib/api-service'

export async function GET() {
  try {
    console.log('🔍 Starting debug sync analysis...')

    // Get all files in storage
    const inFiles = await apiService.listAdministrativeDocumentFiles('IN')
    const outFiles = await apiService.listAdministrativeDocumentFiles('OUT')

    // Get all residents
    const residents = await apiService.getResidents()

    // Get all existing documents in database
    const existingDocs = await apiService.getAdministrativeDocuments()

    // Analyze IN files
    const inAnalysis = {
      totalFiles: inFiles.length,
      files: inFiles.map(f => ({
        name: f.name,
        fullPath: f.fullPath,
        size: f.metadata?.size || 0
      })),
      matchAnalysis: [] as any[]
    }

    // For each file, try to match with a resident
    for (const file of inFiles) {
      const matches = []
      for (const resident of residents) {
        // Check if file matches this resident
        const badgeStr = String(resident.badge || '').trim()
        const residentName = {
          firstName: resident.first_name,
          lastName: resident.last_name
        }

        // Use the same matching logic as the sync function
        const normalizeText = (value?: string | null) =>
          (value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '')
            .trim()

        const firstNameNormalized = normalizeText(residentName?.firstName)
        const lastNameNormalized = normalizeText(residentName?.lastName)
        const combinedName = firstNameNormalized + lastNameNormalized
        const combinedNameReversed = lastNameNormalized + firstNameNormalized
        const lowerBadge = badgeStr.toLowerCase()
        const badgeWithoutLeadingZeros = badgeStr.replace(/^0+/, '')
        const lowerBadgeNoZeros = badgeWithoutLeadingZeros.toLowerCase()
        const fullPathLower = file.fullPath.toLowerCase()
        const fileNameLower = file.name.toLowerCase()
        const digitsOnly = file.fullPath.replace(/[^0-9]/g, '')

        let matched = false
        let matchReason = ''

        // Check name matching
        if (firstNameNormalized || lastNameNormalized) {
          const nameCandidates = [firstNameNormalized, lastNameNormalized, combinedName, combinedNameReversed]
            .filter(Boolean) as string[]
          for (const candidate of nameCandidates) {
            if (candidate.length >= 3 && fileNameLower.replace(/[^a-z0-9]/g, '').includes(candidate)) {
              matched = true
              matchReason = `Name match: ${candidate}`
              break
            }
          }
        }

        // Check badge matching
        if (!matched) {
          const badgeCandidates = [
            lowerBadge,
            lowerBadgeNoZeros,
            `badge${lowerBadge}`,
            `badge${lowerBadgeNoZeros}`,
            `${lowerBadge}_`,
            `_${lowerBadge}`,
            `${lowerBadgeNoZeros}_`,
            `_${lowerBadgeNoZeros}`
          ].filter(Boolean)

          for (const candidate of badgeCandidates) {
            if (candidate.length >= 2 && (fullPathLower.includes(candidate) || fileNameLower.includes(candidate))) {
              matched = true
              matchReason = `Badge match: ${candidate}`
              break
            }
          }

          // Digits-only matching for 4+ digit badges
          if (!matched && badgeStr.length >= 4 && digitsOnly.includes(badgeStr)) {
            matched = true
            matchReason = `Digits match: ${badgeStr}`
          }
        }

        if (matched) {
          matches.push({
            residentId: resident.id,
            badge: resident.badge,
            name: `${resident.first_name} ${resident.last_name}`,
            matchReason
          })
        }
      }

      // Check if document already exists in database
      const fileName = file.fullPath.split('/').pop() || file.name
      const existsInDb = existingDocs.some(doc =>
        doc.file_name === fileName && doc.document_type === 'IN'
      )

      inAnalysis.matchAnalysis.push({
        file: file.name,
        fullPath: file.fullPath,
        matches: matches,
        matchCount: matches.length,
        existsInDatabase: existsInDb,
        shouldSync: matches.length > 0 && !existsInDb
      })
    }

    // Analyze OUT files
    const outAnalysis = {
      totalFiles: outFiles.length,
      files: outFiles.map(f => ({
        name: f.name,
        fullPath: f.fullPath,
        size: f.metadata?.size || 0
      }))
    }

    // Summary
    const summary = {
      storage: {
        inFiles: inAnalysis.totalFiles,
        outFiles: outAnalysis.totalFiles,
        totalFiles: inAnalysis.totalFiles + outAnalysis.totalFiles
      },
      database: {
        totalDocuments: existingDocs.length,
        inDocuments: existingDocs.filter(d => d.document_type === 'IN').length,
        outDocuments: existingDocs.filter(d => d.document_type === 'OUT').length
      },
      residents: {
        total: residents.length,
        withBadges: residents.filter(r => r.badge).length
      },
      syncAnalysis: {
        filesWithMatches: inAnalysis.matchAnalysis.filter(a => a.matchCount > 0).length,
        filesWithoutMatches: inAnalysis.matchAnalysis.filter(a => a.matchCount === 0).length,
        filesAlreadyInDb: inAnalysis.matchAnalysis.filter(a => a.existsInDatabase).length,
        filesToSync: inAnalysis.matchAnalysis.filter(a => a.shouldSync).length
      }
    }

    return NextResponse.json({
      success: true,
      summary,
      inAnalysis,
      outAnalysis,
      message: `Found ${summary.storage.totalFiles} files in storage, ${summary.database.totalDocuments} in database. ${summary.syncAnalysis.filesToSync} files need syncing.`
    })

  } catch (error) {
    console.error('❌ Error in debug sync:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during debug sync'
    }, { status: 500 })
  }
}
