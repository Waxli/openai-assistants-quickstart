import { openai } from "@/app/openai";
import { NextRequest } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import * as fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Create a temporary file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempFilePath = join('/tmp', randomUUID());
    await writeFile(tempFilePath, buffer);
    
    // Create a read stream for the file
    const fileStream = fs.createReadStream(tempFilePath);
    const fileName = file.name;
    
    // Upload the file to OpenAI
    const openaiFile = await openai.files.create({
      file: fileStream,
      purpose: "assistants",
    });
    
    // Clean up the temporary file
    fs.unlink(tempFilePath, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });
    
    return new Response(
      JSON.stringify({ 
        message: "File uploaded successfully", 
        fileId: openaiFile.id, 
        fileName 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    console.error('Error uploading file:', error);
    return new Response(
      JSON.stringify({ error: 'Error uploading file' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
