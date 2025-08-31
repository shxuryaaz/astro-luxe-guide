# BNN PDF Setup Guide

## How to Use BNN (Bhrigu Nandi Nadi) Readings

The Astrometry app now automatically uses your BNN document for generating personalized astrological readings.

### Setup Instructions:

1. **Place your BNN PDF** in the project root directory:
   ```
   astro-luxe-guide/
   ├── BNN_05_Dec_24.pdf  ← Place your BNN PDF here
   ├── src/
   ├── server/
   └── ...
   ```

2. **File Requirements:**
   - Filename must be exactly: `BNN_05_Dec_24.pdf`
   - Must be a readable PDF file
   - Should contain Bhrigu Nandi Nadi methodology and rules

3. **How It Works:**
   - When a user clicks "Get Reading with BNN", the system automatically:
     - Loads your PDF from `./bnn-document.pdf`
     - Processes it into searchable knowledge chunks
     - Uses it to generate personalized readings based on the user's birth chart
     - Caches the processed data for faster subsequent readings

4. **No Manual Upload Required:**
   - The PDF is processed automatically when needed
   - No admin panel upload required
   - System checks if PDF exists and processes it on-demand

### Example Usage:

1. User generates their Kundli (birth chart)
2. User selects a question category (Career, Love, etc.)
3. User clicks "Get Reading with BNN"
4. System automatically loads your BNN PDF and generates a reading based on:
   - Your specific BNN methodology
   - User's planetary positions
   - User's birth chart data
   - The specific question asked

### Troubleshooting:

- **"BNN PDF not found"**: Make sure `bnn-document.pdf` exists in the project root
- **Processing errors**: Ensure the PDF is readable and not corrupted
- **No BNN content**: Verify your PDF contains Bhrigu Nandi Nadi methodology

The system will provide detailed error messages if there are any issues with the PDF setup.
