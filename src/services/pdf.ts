import jsPDF from 'jspdf'

export interface PDFOptions {
  title: string
  content: string
  fileName?: string
  includeHeader?: boolean
  includeFooter?: boolean
}

export const pdfService = {
  // Generate PDF from astrological reading
  async generateReadingPDF(options: PDFOptions): Promise<Blob> {
    const { title, content, fileName = 'astrological-reading.pdf', includeHeader = true, includeFooter = true } = options

    // Create new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)

    // Set font
    doc.setFont('helvetica')
    doc.setFontSize(16)

    let yPosition = margin + 20

    // Add header
    if (includeHeader) {
      doc.setFillColor(44, 62, 80)
      doc.rect(0, 0, pageWidth, 35, 'F')
      
      // Add logo (if available)
      try {
        const logoUrl = '/astrologo.jpg'
        const img = new Image()
        img.onload = () => {
          doc.addImage(img, 'JPEG', margin, 5, 25, 25)
        }
        img.src = logoUrl
      } catch (error) {
        console.log('Logo not available, using text only')
      }
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('Astrometry', margin + 30, 20)
      
      doc.setFontSize(12)
      doc.text('Bhrigu Nandi Nadi Reading', margin + 30, 28)
      
      // Reset text color
      doc.setTextColor(0, 0, 0)
      yPosition = 45
    }

    // Add title
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(title, margin, yPosition)
    yPosition += 15

    // Add content
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    
    const lines = this.splitTextToSize(content, contentWidth, doc)
    
    for (const line of lines) {
      // Check if we need a new page
      if (yPosition > pageHeight - margin - 20) {
        doc.addPage()
        yPosition = margin + 20
        
        // Add page number
        if (includeFooter) {
          doc.setFontSize(10)
          doc.setTextColor(128, 128, 128)
          doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
          doc.setTextColor(0, 0, 0)
        }
      }
      
      // Handle different content types
      if (line.startsWith('**') && line.endsWith('**')) {
        // Bold text
        doc.setFont('helvetica', 'bold')
        doc.text(line.replace(/\*\*/g, ''), margin, yPosition)
        doc.setFont('helvetica', 'normal')
      } else if (line.startsWith('- ')) {
        // Bullet point
        doc.text('• ' + line.substring(2), margin + 5, yPosition)
      } else if (line.startsWith('#')) {
        // Heading
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(14)
        doc.text(line.replace(/^#+\s*/, ''), margin, yPosition)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(12)
      } else {
        // Regular text
        doc.text(line, margin, yPosition)
      }
      
      yPosition += 7
    }

    // Add footer
    if (includeFooter) {
      doc.setFontSize(10)
      doc.setTextColor(128, 128, 128)
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, margin, pageHeight - 15)
      doc.text('Astrometry - BNN Analysis', pageWidth - margin, pageHeight - 15, { align: 'right' })
      doc.setTextColor(0, 0, 0)
    }

    // Generate blob
    const pdfBlob = doc.output('blob')
    return pdfBlob
  },

  // Split text to fit within page width
  splitTextToSize(text: string, maxWidth: number, doc: jsPDF): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const testWidth = doc.getTextWidth(testLine)
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    
    if (currentLine) {
      lines.push(currentLine)
    }
    
    return lines
  },

  // Download PDF
  downloadPDF(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },

  // Generate comprehensive reading PDF
  async generateComprehensiveReadingPDF(data: {
    userDetails: {
      name: string
      dateOfBirth: string
      timeOfBirth: string
      placeOfBirth: string
    }
    question: {
      text: string
      category: string
    }
    reading: string
    planetaryPositions: any[]
  }): Promise<Blob> {
    try {
      const { userDetails, question, reading, planetaryPositions } = data
      
      console.log('📄 Generating comprehensive reading PDF with data:', {
        userDetails,
        question: question.text,
        readingLength: reading.length,
        planetaryPositionsCount: planetaryPositions?.length || 0
      });

      // Create new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      const contentWidth = pageWidth - (margin * 2)

      let yPosition = margin

      // Add header with logo
      doc.setFillColor(44, 62, 80)
      doc.rect(0, 0, pageWidth, 35, 'F')
      
      // Add logo (synchronous loading)
      try {
        const logoUrl = '/astrologo.jpg'
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = logoUrl
        
        // Wait for image to load before adding to PDF
        await new Promise((resolve, reject) => {
          img.onload = () => {
            try {
              doc.addImage(img, 'JPEG', margin, 5, 25, 25)
              resolve(true)
            } catch (error) {
              console.log('Error adding logo to PDF:', error)
              resolve(false)
            }
          }
          img.onerror = () => {
            console.log('Logo failed to load')
            resolve(false)
          }
          // Timeout after 2 seconds
          setTimeout(() => resolve(false), 2000)
        })
      } catch (error) {
        console.log('Logo not available:', error)
      }
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('Astrometry', margin + 30, 18)
      
      doc.setFontSize(10)
      doc.text('Bhrigu Nandi Nadi Reading', margin + 30, 26)
      
      // Reset text color and position
      doc.setTextColor(0, 0, 0)
      yPosition = 45

      // Main title
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text('Astrological Reading - BNN', margin, yPosition)
      yPosition += 12

      doc.setFontSize(14)
      doc.setFont('helvetica', 'normal')
      doc.text('Bhrigu Nandi Nadi Analysis', margin, yPosition)
      yPosition += 20

      // Client Information Section
      doc.setFillColor(245, 245, 245)
      doc.rect(margin, yPosition - 8, contentWidth, 12, 'F')
      
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('Client Information', margin + 8, yPosition)
      yPosition += 12

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Name: ${userDetails.name}`, margin + 5, yPosition)
      yPosition += 5
      doc.text(`Date of Birth: ${userDetails.dateOfBirth}`, margin + 5, yPosition)
      yPosition += 5
      doc.text(`Time of Birth: ${userDetails.timeOfBirth}`, margin + 5, yPosition)
      yPosition += 5
      doc.text(`Place of Birth: ${userDetails.placeOfBirth}`, margin + 5, yPosition)
      yPosition += 5
      doc.text(`Question: ${question.text}`, margin + 5, yPosition)
      yPosition += 5
      doc.text(`System: Bhrigu Nandi Nadi (BNN)`, margin + 5, yPosition)
      yPosition += 15

      // Planetary Positions Section
      if (planetaryPositions && Array.isArray(planetaryPositions) && planetaryPositions.length > 0) {
        doc.setFillColor(245, 245, 245)
        doc.rect(margin, yPosition - 8, contentWidth, 12, 'F')
        
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.text('Key Planetary Positions', margin + 8, yPosition)
        yPosition += 12

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        
        planetaryPositions.forEach(planet => {
          const name = planet.name || 'Unknown'
          const sign = planet.sign || 'Unknown'
          const degree = planet.degree || '0°'
          const house = planet.house || 'Unknown'
          const nakshatra = planet.nakshatra || 'Unknown'
          const isRetrograde = planet.is_retrograde ? ' (Retrograde)' : ''
          
          doc.text(`${name}: ${sign} ${degree} in ${house}th house, Nakshatra: ${nakshatra}${isRetrograde}`, margin + 5, yPosition)
          yPosition += 4
        })
        yPosition += 10
      }

      // Reading Section
      doc.setFillColor(245, 245, 245)
      doc.rect(margin, yPosition - 8, contentWidth, 12, 'F')
      
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('BNN Astrological Reading', margin + 8, yPosition)
      yPosition += 12

      // Split reading into paragraphs and add them
      const readingParagraphs = reading.split('\n\n').filter(p => p.trim())
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      
      readingParagraphs.forEach(paragraph => {
        const lines = doc.splitTextToSize(paragraph.trim(), contentWidth - 10)
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage()
            yPosition = margin
          }
          doc.text(line, margin + 5, yPosition)
          yPosition += 4
        })
        yPosition += 2
      })

      // Important Notes Section
      if (yPosition > pageHeight - 60) {
        doc.addPage()
        yPosition = margin
      }

      doc.setFillColor(245, 245, 245)
      doc.rect(margin, yPosition - 8, contentWidth, 12, 'F')
      
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('Important Notes', margin + 8, yPosition)
      yPosition += 12

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      const notes = [
        'This reading is based on the ancient Bhrigu Nandi Nadi system',
        'Astrology reveals potential - your choices determine your destiny',
        'Consult with qualified professionals for important life decisions',
        'This reading is for guidance purposes only'
      ]
      
      notes.forEach(note => {
        doc.text(`• ${note}`, margin + 5, yPosition)
        yPosition += 4
      })

      // Footer
      yPosition = pageHeight - 15
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition)
      doc.text('System: Astrometry - BNN Analysis', pageWidth - margin - 50, yPosition)

      return doc.output('blob')
    } catch (error) {
      console.error('❌ Error generating comprehensive reading PDF:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  },

  // Generate comprehensive Kundli PDF
  async generateKundliPDF(kundliData: any): Promise<Blob> {
    // Create new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)

    // Set initial position
    let yPosition = margin + 20

    // Add header
    doc.setFillColor(44, 62, 80)
    doc.rect(0, 0, pageWidth, 30, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Astrometry', margin, 20)
    
    doc.setFontSize(12)
    doc.text('Birth Chart (Kundli) Analysis', margin, 28)
    
    // Reset text color and position
    doc.setTextColor(0, 0, 0)
    yPosition = 40

    // Add title
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(`Birth Chart - ${kundliData.name}`, margin, yPosition)
    yPosition += 15

    // Add personal information
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Personal Information:', margin, yPosition)
    yPosition += 8

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Name: ${kundliData.name}`, margin, yPosition)
    yPosition += 6
    doc.text(`Date of Birth: ${kundliData.dateOfBirth}`, margin, yPosition)
    yPosition += 6
    doc.text(`Time of Birth: ${kundliData.timeOfBirth}`, margin, yPosition)
    yPosition += 6
    doc.text(`Place of Birth: ${kundliData.placeOfBirth}`, margin, yPosition)
    yPosition += 12

    // Add birth chart details
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Birth Chart Details:', margin, yPosition)
    yPosition += 8

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Ascendant: ${kundliData.ascendant?.sign || 'Not available'} ${kundliData.ascendant?.degree || '0'}°`, margin, yPosition)
    yPosition += 6
    doc.text(`Zodiac Sign: ${kundliData.zodiac?.name || 'Not available'}`, margin, yPosition)
    yPosition += 12

    // Add planetary positions
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Planetary Positions:', margin, yPosition)
    yPosition += 8

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    
    if (kundliData.planetaryPositions && kundliData.planetaryPositions.length > 0) {
      kundliData.planetaryPositions.forEach((planet: any) => {
        const planetText = `${planet.name}: ${planet.sign} ${planet.degree}° in ${planet.house}th house`
        doc.text(planetText, margin, yPosition)
        yPosition += 6
      })
    } else {
      doc.text('No planetary positions available', margin, yPosition)
      yPosition += 6
    }
    yPosition += 6

    // Add Nakshatra details
    if (kundliData.nakshatra) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Nakshatra Details:', margin, yPosition)
      yPosition += 8

      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`Nakshatra: ${kundliData.nakshatra.name}`, margin, yPosition)
      yPosition += 6
      doc.text(`Pada: ${kundliData.nakshatra.pada}`, margin, yPosition)
      yPosition += 6
      doc.text(`Lord: ${kundliData.nakshatra.lord?.name || 'Not available'}`, margin, yPosition)
      yPosition += 12
    }

    // Add Rashi details
    if (kundliData.chandra_rasi || kundliData.soorya_rasi) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Rashi Details:', margin, yPosition)
      yPosition += 8

      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      
      if (kundliData.chandra_rasi) {
        doc.text(`Chandra Rashi: ${kundliData.chandra_rasi.name}`, margin, yPosition)
        yPosition += 6
        doc.text(`Chandra Rashi Lord: ${kundliData.chandra_rasi.lord?.name || 'Not available'}`, margin, yPosition)
        yPosition += 6
      }
      
      if (kundliData.soorya_rasi) {
        doc.text(`Soorya Rashi: ${kundliData.soorya_rasi.name}`, margin, yPosition)
        yPosition += 6
        doc.text(`Soorya Rashi Lord: ${kundliData.soorya_rasi.lord?.name || 'Not available'}`, margin, yPosition)
        yPosition += 6
      }
      yPosition += 6
    }

    // Add additional information
    if (kundliData.additional_info) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Additional Information:', margin, yPosition)
      yPosition += 8

      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      
      const additionalInfo = [
        `Deity: ${kundliData.additional_info.deity}`,
        `Ganam: ${kundliData.additional_info.ganam}`,
        `Symbol: ${kundliData.additional_info.symbol}`,
        `Animal Sign: ${kundliData.additional_info.animal_sign}`,
        `Nadi: ${kundliData.additional_info.nadi}`,
        `Color: ${kundliData.additional_info.color}`,
        `Best Direction: ${kundliData.additional_info.best_direction}`,
        `Birth Stone: ${kundliData.additional_info.birth_stone}`,
        `Planet: ${kundliData.additional_info.planet}`,
        `Gender: ${kundliData.additional_info.gender}`,
        `Syllables: ${kundliData.additional_info.syllables}`,
        `Enemy Yoni: ${kundliData.additional_info.enemy_yoni}`
      ]

      additionalInfo.forEach(info => {
        doc.text(info, margin, yPosition)
        yPosition += 6
      })
      yPosition += 6
    }

    // Add important notes
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Important Notes:', margin, yPosition)
    yPosition += 8

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    const notes = [
      '• This birth chart is generated using ProKerala Astrology API',
      '• Astrology reveals potential - your choices determine your destiny',
      '• Consult with qualified professionals for important life decisions',
      '• This chart is for guidance purposes only'
    ]

    notes.forEach(note => {
      doc.text(note, margin, yPosition)
      yPosition += 6
    })
    yPosition += 6

    // Add footer
    doc.setFontSize(10)
    doc.setTextColor(128, 128, 128)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition)
    yPosition += 5
    doc.text('System: Astrometry - ProKerala Analysis', margin, yPosition)

    // Convert to blob
    const pdfBlob = doc.output('blob')
    return pdfBlob
  }
}
