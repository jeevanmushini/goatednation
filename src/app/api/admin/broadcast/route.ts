import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '../../../../lib/auth/jwt';
import { getUsersFromNeon } from '../../../../lib/db/neon';
import { sendNewDropEmail } from '../../../../lib/email/mailer';
import { UserRecord } from '../../../../types/auth';

export async function POST(req: NextRequest) {
  try {
    // 1. Authorize admin clearance via JWT token cookie or header
    const token =
      req.cookies.get('auth_token')?.value ||
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Admin token missing.' },
        { status: 401 }
      );
    }

    const payload = verifyJwt(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Syndicate Administrator clearance required.' },
        { status: 403 }
      );
    }

    // 2. Parse broadcast payload
    const body = await req.json();
    const { dropTitle, tagline, description, bannerUrl, dropUrl, recipients } = body;

    if (!dropTitle) {
      return NextResponse.json(
        { success: false, error: 'Drop title is required.' },
        { status: 400 }
      );
    }

    let targetEmails: string[] = [];

    if (Array.isArray(recipients) && recipients.length > 0) {
      targetEmails = recipients;
    } else {
      // Load all registered customers from database
      const users = await getUsersFromNeon<UserRecord>();
      targetEmails = users
        .map((u) => u.email)
        .filter((email): email is string => Boolean(email && email.includes('@')));
    }

    if (targetEmails.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'No recipients found to dispatch drop announcement.',
      });
    }

    // 3. Dispatch drop announcement email (non-blocking)
    const emailPromises = targetEmails.map((email) =>
      sendNewDropEmail({
        to: email,
        dropTitle,
        tagline,
        description,
        bannerUrl,
        dropUrl,
      })
    );

    Promise.allSettled(emailPromises).then((results) => {
      const successful = results.filter((r) => r.status === 'fulfilled').length;
      console.log(`[Admin Broadcast] Dispatched drop announcement to ${successful}/${targetEmails.length} recipients.`);
    });

    return NextResponse.json({
      success: true,
      count: targetEmails.length,
      message: `Editorial drop announcement queued for ${targetEmails.length} syndicate collectors.`,
    });
  } catch (error: unknown) {
    console.error('[Admin Broadcast] Route error:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}
