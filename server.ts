import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API health endpoint
app.get(['/api/health', '/health'], (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Inbound email webhook from Resend (Forwards to DM)
app.post(['/inbound', '/api/inbound'], async (req, res) => {
  try {
    const data = req.body;
    const emailMetadata = data?.data || data || {};

    const sender = emailMetadata.from || 'Unknown Sender';
    const subject = emailMetadata.subject || '(No Subject)';
    
    // We try to get text, then html if text is empty
    let textBody = emailMetadata.text || emailMetadata.html?.replace(/<[^>]*>/g, '') || 'Could not retrieve email body.';

    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || '8822102406:AAGwMQDrH0PTtygnYOAEHWKJ4qgaxHFHwHs';
    // Send to group ID
    const targetChatId = process.env.TELEGRAM_CHAT_ID || '-1004399283423';

    console.log(`[INBOUND WEBHOOK] Received email from ${sender} with subject: ${subject}`);

    if (telegramBotToken && targetChatId) {
      const message =
        `📧 *New Inbound Email*\n\n` +
        `👤 *From:* ${sender}\n` +
        `📌 *Subject:* ${subject}\n` +
        `🕒 *Received:* ${new Date().toLocaleString()}\n\n` +
        `📝 *Message:*\n${textBody}`;

      const tgRes = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: message,
          parse_mode: 'Markdown'
        }),
      });
      
      if (!tgRes.ok) {
         console.error('[INBOUND WEBHOOK] Failed to forward to telegram:', await tgRes.text());
      } else {
         console.log('[INBOUND WEBHOOK] Successfully forwarded to telegram group');
      }
    }

    return res.status(200).json({ status: 'success' });
  } catch (error: any) {
    console.error('[INBOUND ERROR]', error);
    return res.status(500).json({ error: error.message });
  }
});

// In-memory set of authorized sudo users (stored as string user IDs or lowercase @usernames)
const sudoUsers = new Set<string>();

// Helper to escape markdown special characters for Telegram alerts
function escapeMd(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

// Telegram Contact Dispatch Endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, category, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Please provide name, email, and project brief.' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN || '8969258082:AAHz_-2Mm6M2ZKBiY3LtSO7ZEgm2Yi32ujs';
    const chatId = process.env.TELEGRAM_CHAT_ID || '-1004399283423';
    const ownerId = process.env.TELEGRAM_OWNER_ID || '8761043571';

    // Format clean Telegram markdown message
    const telegramText =
      `⚡ *NEW VXRE INQUIRY DISPATCHED* ⚡\n\n` +
      `👤 *Entity / Name:* ${name}\n` +
      `📧 *Email Address:* ${email}\n` +
      `🎯 *Specialization:* ${category || 'Marketing Agency'}\n` +
      `🕒 *Received At:* ${new Date().toLocaleString()}\n\n` +
      `📝 *Project Brief / Inquiry:*\n${message}`;

    const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: telegramText,
        parse_mode: 'Markdown',
      }),
    });

    const result = (await telegramRes.json()) as { ok: boolean; description?: string; result?: { message_id: number } };

    if (!telegramRes.ok || !result.ok) {
      console.error('Telegram API Dispatch error:', result);
      return res.status(502).json({
        error: result.description || 'Failed to dispatch notification to Telegram group.',
      });
    }

    return res.json({ success: true, messageId: result.result?.message_id });
  } catch (err: any) {
    console.error('Server error handling contact request:', err);
    return res.status(500).json({ error: err.message || 'Internal transmission error' });
  }
});

// Background Telegram Bot Polling to listen for /start in private and group chats
async function startTelegramPolling() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '8969258082:AAHz_-2Mm6M2ZKBiY3LtSO7ZEgm2Yi32ujs';
  let offset = 0;

  console.log('[Telegram Bot] Starting command listener loop...');

  while (true) {
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${botToken}/getUpdates?offset=${offset}&timeout=10&allowed_updates=["message"]`,
        { signal: AbortSignal.timeout(15000) }
      );

      if (!res.ok) {
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }

      const data = (await res.json()) as {
        ok: boolean;
        result: Array<{
          update_id: number;
          message?: {
            message_id: number;
            chat: { id: number | string; type: string; title?: string };
            from?: { first_name?: string; username?: string };
            text?: string;
          };
        }>;
      };

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = Math.max(offset, update.update_id + 1);

          const msg = update.message;
          if (!msg || !msg.text) continue;

          const rawText = msg.text.trim();
          const lowerText = rawText.toLowerCase();
          const isStartCommand = lowerText.startsWith('/start');
          const isHelpCommand = lowerText === '/help' || lowerText.startsWith('/help ');
          const isSendCommand = lowerText.startsWith('/send');
          const isSudoCommand = lowerText.startsWith('/sudo');
          const isUnsudoCommand = lowerText.startsWith('/unsudo');
          const isSudoListCommand = lowerText.startsWith('/sudolist');

          // Strict Authorization Check:
          // Authorized entities: Owner ID, Authorized Group ID, or any user added to sudoUsers
          const currentChatId = String(msg.chat.id);
          const currentSenderId = String(msg.from?.id || '');
          const currentSenderUsername = (msg.from?.username || '').toLowerCase();
          const authorizedGroupId = String(process.env.TELEGRAM_CHAT_ID || '-1004399283423');
          const authorizedOwnerId = String(process.env.TELEGRAM_OWNER_ID || '8761043571');

          const isOwner = currentSenderId === authorizedOwnerId;
          const isSudoUser =
            sudoUsers.has(currentSenderId) ||
            (currentSenderUsername && sudoUsers.has(`@${currentSenderUsername}`));

          const isAuthorized =
            isOwner ||
            isSudoUser ||
            currentChatId === authorizedGroupId;

          // If an unauthorized user attempts to interact with the bot:
          if (!isAuthorized) {
            console.warn(`[Telegram Bot] Unauthorized interaction attempt by user: ${currentSenderId} (${msg.from?.username || 'No username'})`);

            // Dispatch an immediate security alert directly to the OWNER:
            const attackerInfo =
              `🚨 *SECURITY ALERT: UNAUTHORIZED ACCESS ATTEMPT* 🚨\n\n` +
              `An unauthorized user attempted to interact with your VXRE bot:\n\n` +
              `👤 *Name:* ${escapeMd(msg.from?.first_name || '')} ${escapeMd(msg.from?.last_name || '')}\n` +
              `🆔 *Numeric ID:* \`${currentSenderId}\`\n` +
              `🔗 *Username:* ${msg.from?.username ? '@' + escapeMd(msg.from.username) : 'None'}\n` +
              `💬 *Message / Command:* \`${escapeMd(rawText.slice(0, 100))}\`\n` +
              `🕒 *Timestamp:* ${escapeMd(new Date().toLocaleString())}\n\n` +
              `_The bot stayed completely silent and did not respond to this user._\n` +
              `_To grant them sudo access, reply with:_ \`/sudo ${currentSenderId}\``;

            try {
              await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: authorizedOwnerId,
                  text: attackerInfo,
                  parse_mode: 'Markdown',
                }),
              });
            } catch (alertErr) {
              console.error('Failed to notify owner about unauthorized user:', alertErr);
            }

            // Remain silent to the unauthorized user
            continue;
          }

          // --- OWNER PRIVILEGED COMMANDS (/sudo, /unsudo, /sudolist) ---
          if (isSudoCommand && !isSudoListCommand) {
            if (!isOwner) {
              await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: msg.chat.id,
                  reply_to_message_id: msg.message_id,
                  text: '⛔ *Permission Denied:* Only the supreme owner can grant sudo privileges.',
                  parse_mode: 'Markdown',
                }),
              });
              continue;
            }

            const parts = rawText.split(/\s+/);
            const target = parts[1]?.trim();

            if (!target) {
              await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: msg.chat.id,
                  reply_to_message_id: msg.message_id,
                  text: '⚠️ *Usage:* `/sudo <numeric_id | @username>`\n\nExample:\n`/sudo 123456789`\n`/sudo @alexander`',
                  parse_mode: 'Markdown',
                }),
              });
              continue;
            }

            const cleanTarget = target.startsWith('@') ? target.toLowerCase() : target;
            sudoUsers.add(cleanTarget);

            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: msg.chat.id,
                  reply_to_message_id: msg.message_id,
                  text: `✅ *Privilege Granted:* \`${cleanTarget}\` has been elevated to *Sudo*. They can now communicate with the bot directly.`,
                  parse_mode: 'Markdown',
                }),
              });
            continue;
          }

          if (isUnsudoCommand) {
            if (!isOwner) {
              await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: msg.chat.id,
                  reply_to_message_id: msg.message_id,
                  text: '⛔ *Permission Denied:* Only the supreme owner can revoke sudo privileges.',
                  parse_mode: 'Markdown',
                }),
              });
              continue;
            }

            const parts = rawText.split(/\s+/);
            const target = parts[1]?.trim();
            const cleanTarget = target?.startsWith('@') ? target.toLowerCase() : target;

            if (cleanTarget && sudoUsers.has(cleanTarget)) {
              sudoUsers.delete(cleanTarget);
              await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: msg.chat.id,
                  reply_to_message_id: msg.message_id,
                  text: `🗑️ *Privilege Revoked:* \`${cleanTarget}\` has been removed from Sudo list.`,
                  parse_mode: 'Markdown',
                }),
              });
            } else {
              await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: msg.chat.id,
                  reply_to_message_id: msg.message_id,
                  text: `⚠️ Target \`${target || 'none'}\` is not in the Sudo list.`,
                  parse_mode: 'Markdown',
                }),
              });
            }
            continue;
          }

          if (isSudoListCommand) {
            if (!isOwner && !isSudoUser) {
              continue;
            }

            const sudoArray = Array.from(sudoUsers);
            const listText =
              sudoArray.length === 0
                ? '_No additional sudo users elevated._'
                : sudoArray.map((u, i) => `${i + 1}. \`${u}\``).join('\n');

            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: msg.chat.id,
                reply_to_message_id: msg.message_id,
                text:
                  `🛡️ *VXRE SOVEREIGN ACCESS REGISTRY*\n\n` +
                  `👑 *Supreme Owner:* \`${authorizedOwnerId}\`\n` +
                  `🏛️ *Authorized Group:* \`${authorizedGroupId}\`\n\n` +
                  `⚡ *Elevated Sudo Operators (${sudoArray.length}):*\n${listText}\n\n` +
                  `_To add sudo:_ \`/sudo <id | @username>\`\n` +
                  `_To revoke sudo:_ \`/unsudo <id | @username>\``,
                parse_mode: 'Markdown',
              }),
            });
            continue;
          }

          // --- /help COMMAND: LIST ALL COMMANDS, MEANINGS & USE CASES ---
          if (isHelpCommand) {
            const helpText =
              `📜 *VXRE BOT // COMMAND MANUAL & SPECIFICATION*\n\n` +
              `✦ *PUBLIC & CORE COMMANDS:*\n` +
              `• \`/start\`\n` +
              `  └ *Purpose:* Welcomes verified operators and displays quick access links to the live VXRE portal & executive WhatsApp line.\n\n` +
              `• \`/help\`\n` +
              `  └ *Purpose:* Displays this comprehensive command documentation and exact usage formats.\n\n` +
              `✦ *TRANSMISSION COMMANDS:*\n` +
              `• \`/send [target] [subject] [message]\`\n` +
              `  └ *Purpose:* Dispatches a sovereign transmission to a designated user ID, group, or email.\n` +
              `  └ *Syntax Options:*\n` +
              `     1. Bracketed format:\n` +
              `        \`/send [8761043571] [Partnership Retainer] Hello, we are ready to proceed with deployment.\`\n` +
              `     2. Standard format:\n` +
              `        \`/send 8761043571 Partnership Retainer | Hello, we are ready to proceed.\`\n\n` +
              `✦ *OWNER PRIVILEGED ACCESS CONTROLS:*\n` +
              `• \`/sudo <numeric_id | @username>\`\n` +
              `  └ *Access:* Supreme Owner only\n` +
              `  └ *Purpose:* Grants sudo operator privileges to another Telegram user.\n` +
              `  └ *Example:* \`/sudo 123456789\` or \`/sudo @colleague\`\n\n` +
              `• \`/unsudo <numeric_id | @username>\`\n` +
              `  └ *Access:* Supreme Owner only\n` +
              `  └ *Purpose:* Immediately revokes sudo privileges from an operator.\n` +
              `  └ *Example:* \`/unsudo 123456789\`\n\n` +
              `• \`/sudolist\`\n` +
              `  └ *Access:* Supreme Owner & Sudo Operators\n` +
              `  └ *Purpose:* Inspects registry of currently authorized sudo operators.\n\n` +
              `🛡️ *Security:* Any message from unauthorized users triggers an instant security alert to the owner.`;

            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: msg.chat.id,
                reply_to_message_id: msg.message_id,
                text: helpText,
                parse_mode: 'Markdown',
              }),
            });
            continue;
          }

          // --- /send COMMAND: DISPATCH TRANSMISSION ---
          if (isSendCommand) {
            // Remove the initial /send
            const commandContent = rawText.replace(/^\/send(@\w+)?/i, '').trim();

            if (!commandContent) {
              await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: msg.chat.id,
                  reply_to_message_id: msg.message_id,
                  text:
                    `ℹ️ *SEND TRANSMISSION USAGE:*\n\n` +
                    `*Format:*\n` +
                    `\`/send [user_id | email] [subject] [your message details]\`\n\n` +
                    `*Example:*\n` +
                    `\`/send [8761043571] [Project Update] The custom domain vxre.run.place is fully configured and active.\`\n\n` +
                    `_You can also use:_\n` +
                    `\`/send 8761043571 Project Update | Your full message here\``,
                  parse_mode: 'Markdown',
                }),
              });
              continue;
            }

            let target = '';
            let subject = '';
            let bodyMessage = '';

            // 1. Try parsing bracket syntax: /send [target] [subject] message...
            const bracketRegex = /^\[([^\]]+)\]\s*\[([^\]]+)\]\s*([\s\S]+)$/;
            const bracketMatch = commandContent.match(bracketRegex);

            if (bracketMatch) {
              target = bracketMatch[1].trim();
              subject = bracketMatch[2].trim();
              bodyMessage = bracketMatch[3].trim();
            } else {
              // 2. Try pipe delimiter: /send target subject | body
              const pipeParts = commandContent.split('|');
              if (pipeParts.length >= 2) {
                const headParts = pipeParts[0].trim().split(/\s+/);
                target = headParts[0] || '';
                subject = headParts.slice(1).join(' ') || 'Imperial Notice';
                bodyMessage = pipeParts.slice(1).join('|').trim();
              } else {
                // 3. Fallback: space separated
                const parts = commandContent.split(/\s+/);
                target = parts[0] || '';
                subject = parts[1] || 'Direct Transmission';
                bodyMessage = parts.slice(2).join(' ') || '';
              }
            }

            if (!target || !bodyMessage) {
              await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: msg.chat.id,
                  reply_to_message_id: msg.message_id,
                  text: `⚠️ *Missing Parameters:* Please provide target ID, subject, and message content.\n\n*Format:* \`/send [user_id] [subject] [your message here]\``,
                  parse_mode: 'Markdown',
                }),
              });
              continue;
            }

            // Clean target (strip @ if provided or handle numeric telegram chat ID)
            const isNumericChat = /^-?\d+$/.test(target);
            const isEmailAddress = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target);

            // If it's a Telegram user/group ID:
            if (isNumericChat) {
              const dispatchText =
                `⚡ *NEW INCOMING TRANSMISSION* ⚡\n\n` +
                `🏷️ *Subject:* ${subject}\n` +
                `👤 *Dispatched By:* ${msg.from?.first_name || 'Operator'} (${msg.from?.username ? '@' + msg.from.username : msg.from?.id})\n` +
                `🕒 *Timestamp:* ${new Date().toLocaleString()}\n\n` +
                `📝 *Message:*\n${bodyMessage}`;

              try {
                const sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: target,
                    text: dispatchText,
                    parse_mode: 'Markdown',
                  }),
                });

                const sendResult = (await sendRes.json()) as { ok: boolean; description?: string };

                if (sendResult.ok) {
                  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: msg.chat.id,
                      reply_to_message_id: msg.message_id,
                      text: `✅ *Transmission Successfully Delivered!*\n\n🎯 *Recipient:* \`${target}\`\n📌 *Subject:* \`${subject}\`\n📨 *Payload Length:* ${bodyMessage.length} characters`,
                      parse_mode: 'Markdown',
                    }),
                  });
                } else {
                  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: msg.chat.id,
                      reply_to_message_id: msg.message_id,
                      text: `⚠️ *Delivery Failed:* Telegram returned:\n_${escapeMd(sendResult.description || 'User has not started the bot or blocked it.')}_`,
                      parse_mode: 'Markdown',
                    }),
                  });
                }
              } catch (dispatchErr: any) {
                await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: msg.chat.id,
                    reply_to_message_id: msg.message_id,
                    text: `❌ *Transmission Network Error:* ${escapeMd(dispatchErr?.message || 'Failed to connect.')}`,
                    parse_mode: 'Markdown',
                  }),
                });
              }
              continue;
            }

            // If target is an email address:
            if (isEmailAddress) {
              const resendApiKey = process.env.RESEND_API_KEY || '';

              if (!resendApiKey) {
                await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: msg.chat.id,
                    reply_to_message_id: msg.message_id,
                    text: `⚠️ *Resend API Key Missing:*\nPlease set \`RESEND_API_KEY\` in your environment variables on Render to dispatch outbound emails directly via Telegram.`,
                    parse_mode: 'Markdown',
                  }),
                });
                continue;
              }

              try {
                const formattedHtml = `
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111; line-height: 1.6;">
                    <div style="border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px;">
                      <span style="font-size: 18px; font-weight: 800; letter-spacing: 0.1em;">VXRE</span>
                      <span style="font-size: 11px; color: #666; margin-left: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Imperial Dispatch</span>
                    </div>
                    <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 16px 0; color: #000;">${escapeMd(subject)}</h2>
                    <div style="background: #f9f9fb; border-left: 3px solid #000; padding: 16px 20px; margin-bottom: 24px; font-size: 15px; white-space: pre-wrap;">${bodyMessage}</div>
                    <div style="font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 16px;">
                      Dispatched by authorized operator via VXRE sovereign terminal.<br>
                      Official portal: <a href="https://vxre.run.place" style="color: #000; font-weight: 600; text-decoration: none;">vxre.run.place</a>
                    </div>
                  </div>
                `;

                const emailRes = await fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    from: 'VXRE <no-reply@vxre.run.place>',
                    to: [target],
                    subject: subject,
                    html: formattedHtml,
                  }),
                });

                const emailResult = (await emailRes.json()) as { id?: string; error?: { message: string } };

                if (emailRes.ok && emailResult.id) {
                  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: msg.chat.id,
                      reply_to_message_id: msg.message_id,
                      text:
                        `📧 *Email Transmission Dispatched!*\n\n` +
                        `🎯 *To:* \`${target}\`\n` +
                        `📌 *Subject:* \`${subject}\`\n` +
                        `📬 *From:* \`no-reply@vxre.run.place\`\n` +
                        `🆔 *Resend ID:* \`${emailResult.id}\`\n\n` +
                        `_Cryptographic signatures (SPF, DKIM, DMARC) attached._`,
                      parse_mode: 'Markdown',
                    }),
                  });
                } else {
                  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: msg.chat.id,
                      reply_to_message_id: msg.message_id,
                      text: `⚠️ *Email Transmission Failed:*\n_${escapeMd(emailResult.error?.message || 'Resend API returned an error.')}_`,
                      parse_mode: 'Markdown',
                    }),
                  });
                }
              } catch (emailErr: any) {
                await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: msg.chat.id,
                    reply_to_message_id: msg.message_id,
                    text: `❌ *Network error sending email:* ${escapeMd(emailErr?.message || 'Unknown error')}`,
                    parse_mode: 'Markdown',
                  }),
                });
              }
              continue;
            }

            // If target is an unrecognized format
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: msg.chat.id,
                reply_to_message_id: msg.message_id,
                text: `⚠️ *Unrecognized Target:* \`${target}\`. Please specify a numeric Telegram ID (e.g. \`8761043571\` or \`-1004399283423\`).`,
                parse_mode: 'Markdown',
              }),
            });
            continue;
          }

          // Respond to /start in authorized contexts (owner, sudo, or group)
          if (isStartCommand || msg.chat.type === 'private') {
            const senderName = msg.from?.first_name || 'Imperial Client';
            const portalUrl =
              process.env.APP_URL ||
              'https://vxre.run.place';

            const responseText =
              `🏛️ *VXRE // IMPERIAL SOCIAL ARCHITECTURE*\n\n` +
              `Greetings, *${senderName}*.\n\n` +
              `Welcome to the sovereign direct line of *VXRE*.\n\n` +
              `We engineer discreet digital infrastructure, commanding brand authority, and untouchable web presence for high-stakes founders, institutions, and market leaders.\n\n` +
              `✦ *Core Capabilities:*\n` +
              `• Sovereign Brand Dominance & Narrative Engineering\n` +
              `• Stealth Social Architecture & Audience Capture\n` +
              `• Private Web Security & Digital Asset Protection\n` +
              `• Curated Imperial Campaigns & Retainers\n\n` +
              `💬 *Need to submit an inquiry?*\n` +
              `You can dispatch your brief directly through our portal or connect via WhatsApp below.`;

            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: msg.chat.id,
                reply_to_message_id: msg.message_id,
                text: responseText,
                parse_mode: 'Markdown',
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: '🌐 Open VXRE Portal',
                        url: portalUrl,
                      },
                    ],
                    [
                      {
                        text: '💬 WhatsApp Direct Line',
                        url: 'https://wa.me/573151969168',
                      },
                    ],
                  ],
                },
              }),
            });
          }
        }
      }
    } catch (err) {
      // Long polling timeout or socket drop - wait briefly and retry gracefully
      await new Promise((r) => setTimeout(r, 4000));
    }
  }
}

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    startTelegramPolling().catch((err) => console.error('Telegram bot init error:', err));
  });
}

startServer();
