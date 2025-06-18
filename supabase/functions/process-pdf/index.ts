import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1'
import * as pdfParse from 'https://esm.sh/pdf-parse@1.1.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { file_url, chatbot_id } = await req.json()
    console.log('Processing PDF:', file_url, 'for chatbot:', chatbot_id)

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Download the PDF file
    console.log('Downloading PDF from:', file_url)
    const response = await fetch(file_url)
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    console.log('PDF downloaded, size:', arrayBuffer.byteLength)

    // Process the PDF
    console.log('Parsing PDF content')
    const pdfData = await pdfParse(Buffer.from(arrayBuffer))
    console.log('PDF parsed, pages:', pdfData.numpages)
    
    // Create document record
    console.log('Creating document record')
    const { data: document, error: docError } = await supabaseClient
      .from('documents')
      .insert([{
        chatbot_id,
        title: file_url.split('/').pop(),
        content: pdfData.text,
        file_name: file_url.split('/').pop(),
        file_type: 'application/pdf',
        file_size: arrayBuffer.byteLength,
        file_url,
        status: 'completed',
        metadata: {
          pageCount: pdfData.numpages,
          wordCount: pdfData.text.split(/\s+/).length,
          processedAt: new Date().toISOString()
        }
      }])
      .select()
      .single()

    if (docError) {
      console.error('Error creating document:', docError)
      throw docError
    }
    console.log('Document created:', document.id)

    // Split content into chunks
    console.log('Creating document chunks')
    const chunks = pdfData.text
      .split(/[.!?]+/)
      .filter(s => s.trim().length > 0)
      .map((chunk, index) => ({
        document_id: document.id,
        content: chunk.trim(),
        chunk_index: index,
        metadata: {
          created_at: new Date().toISOString()
        }
      }))

    console.log('Created', chunks.length, 'chunks')

    // Store chunks
    const { error: chunksError } = await supabaseClient
      .from('document_chunks')
      .insert(chunks)

    if (chunksError) {
      console.error('Error storing chunks:', chunksError)
      throw chunksError
    }
    console.log('Chunks stored successfully')

    return new Response(
      JSON.stringify({ success: true, document }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in PDF processing:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
}) 