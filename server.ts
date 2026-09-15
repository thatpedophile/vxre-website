import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API health endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
        `https://api.telegram.org/bot${botToken}/getUpdates?offset=${offset}&timeout=25&allowed_updates=["message"]`
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
          const isHelpCommand = lowerText.startsWith('/help') || lowerText.startsWith('/portal') || lowerText.startsWith('/contact');
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

          // Respond to /start or /help in authorized contexts (owner, sudo, or group)
          if (isStartCommand || isHelpCommand || msg.chat.type === 'private') {
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
      console.error('[Telegram Bot] Polling error:', err);
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
