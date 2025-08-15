import { NextResponse } from 'next/server';
import { processPendingTemplates } from '@/services/template-service';
import { headers } from 'next/headers';

// This is a simple way to protect the endpoint, a more robust solution would use proper auth
const anyscale_proxy_key = process.env.ANYSCALE_PROXY_KEY;

export async function POST() {
  try {
    // Basic security check, replace with your actual auth logic if needed
    const headersList = headers();
    const apiKey = headersList.get('x-api-key');

    const result = await processPendingTemplates(apiKey || undefined);
    
    return NextResponse.json({ success: true, message: `Processing started. ${result.processed} processed, ${result.failed} failed.` });

  } catch (error: any) {
    console.error('Error processing queue:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
