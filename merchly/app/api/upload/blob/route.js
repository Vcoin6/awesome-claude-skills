import { NextResponse } from 'next/server';
import { handleUpload } from '@vercel/blob/client';
import { getRequestUser } from '@/lib/auth';

// POST /api/upload/blob
// Token broker for CLIENT direct-to-Blob uploads. The browser sends the file
// straight to Vercel Blob (bypassing the serverless ~4.5MB request-body limit),
// but first asks this route to mint a short-lived, scoped upload token. We
// authenticate the user and constrain the allowed content types and size here.
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];
const MAX_BYTES = 200 * 1024 * 1024; // 200MB — large videos welcome

export async function POST(req) {
  const body = await req.json();
  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        // Only logged-in users may upload.
        const user = await getRequestUser(req);
        if (!user) throw new Error('You must be logged in to upload.');
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: user.id }),
        };
      },
      onUploadCompleted: async () => {
        // Vercel calls this once the file lands (only on a publicly reachable
        // deployment). Nothing to persist here — the client already receives the
        // final blob URL and attaches it to the listing on publish.
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
