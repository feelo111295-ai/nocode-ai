#!/usr/bin/env node
/**
 * No Code-AI — Autonomous Discord Bot Agent
 * ==========================================
 * Runs a persistent agent loop for one bot.
 * Usage: node bot_agent.mjs <felix|kerry|mia|brody>
 *
 * Each agent:
 *   1. Connects to its Discord MCP server
 *   2. Listens for incoming messages
 *   3. Calls Claude (Anthropic API) with the bot's soul as system prompt
 *   4. Executes tool calls (reply, react, fetch_messages, etc.)
 *   5. Maintains conversation history per chat ID
 */

import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { z } from 'zod';

// ── Supabase activity logging ────────────────────────────────────────────────
const SUPABASE_URL         = process.env.SUPABASE_URL         || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const FELIX_USER_ID        = process.env.FELIX_USER_ID        || null;

// ── Resend email ─────────────────────────────────────────────────────────────
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) return { error: 'RESEND_API_KEY not set' };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from: 'NoCode-AI <onboarding@resend.dev>',
      to,
      subject,
      html,
    }),
  });
  return res.json();
}

async function notifyLeadCaptured({ botDisplay, userName, businessName, messageText }) {
  const subject = `New lead captured by ${botDisplay}`;
  const html = `
    <h2>New Lead Captured</h2>
    <p><strong>Bot:</strong> ${botDisplay}</p>
    <p><strong>Lead name / user:</strong> ${userName || 'Unknown'}</p>
    <p><strong>Business:</strong> ${businessName || 'Not provided'}</p>
    <p><strong>Message:</strong></p>
    <blockquote style="border-left:4px solid #ccc;padding-left:12px;color:#444;">
      ${messageText ? messageText.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '(no message)'}
    </blockquote>
    <p style="color:#888;font-size:12px;">Sent by NoCode-AI bot runtime</p>
  `;
  try {
    await sendEmail({ to: 'felix@nocode-ai.co', subject, html });
    log(`Lead notification sent to felix@nocode-ai.co`);
  } catch (err) {
    log(`Lead notification failed (non-fatal): ${err.message}`);
  }
}

async function insertLead({ botName, name, business, message }) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify({
        user_id:  FELIX_USER_ID,
        bot_name: botName,
        name:     name     || null,
        business: business || null,
        message:  message  ? message.slice(0, 1000) : null,
        status:   'New',
      }),
    });
  } catch (err) {
    // Non-fatal — don't crash the bot over lead storage
  }
}

async function logActivity({ botName, actionType, chatId, messageId, content, metadata = {} }) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return; // skip if not configured
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/bot_activity`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify({
        bot_name:    botName,
        action_type: actionType,
        chat_id:     chatId    || null,
        message_id:  messageId || null,
        content:     content   ? content.slice(0, 500) : null,
        metadata,
      }),
    });
  } catch (err) {
    // Non-fatal — don't crash the bot over logging
  }
}

// ── Config ──────────────────────────────────────────────────────────────────

const BOT_NAME = process.argv[2];

const BOT_CONFIG = {
  felix: { channel: 'discord-felix', soul: 'felix_soul.md',  display: 'Felix Bot'        },
  kerry: { channel: 'discord-kerry', soul: 'kerry_soul.md',  display: 'Kerry (Trendora)' },
  mia:   { channel: 'discord-mia',   soul: 'mia_soul.md',    display: 'Mia'              },
  brody: { channel: 'discord-brody', soul: 'brody_soul.md',  display: 'Brody'            },
};

if (!BOT_CONFIG[BOT_NAME]) {
  console.error('Usage: node bot_agent.mjs <felix|kerry|mia|brody>');
  process.exit(1);
}

const HOME       = homedir();
const BASE_DIR   = join(HOME, '.openclaw');
const CLAUDE_DIR = join(HOME, '.claude');
const config     = BOT_CONFIG[BOT_NAME];

const DISCORD_SERVER = join(
  CLAUDE_DIR,
  'plugins/marketplaces/claude-plugins-official/external_plugins/discord/server.ts'
);
const STATE_DIR  = join(CLAUDE_DIR, 'channels', config.channel);
const SOUL_PATH  = join(BASE_DIR, 'souls', config.soul);

const soul = existsSync(SOUL_PATH)
  ? readFileSync(SOUL_PATH, 'utf8')
  : `You are ${config.display}, an AI assistant for No Code-AI.`;

const log = (msg) => console.log(`[${config.display}] ${msg}`);

// ── Conversation history (per chat_id) ──────────────────────────────────────

// Keep last 20 turns per conversation to maintain context without ballooning
const MAX_HISTORY = 8;
const conversations = new Map(); // chat_id → messages[]

function getHistory(chatId) {
  if (!conversations.has(chatId)) conversations.set(chatId, []);
  return conversations.get(chatId);
}

function trimHistory(messages) {
  while (messages.length > MAX_HISTORY) {
    messages.splice(0, 2);
  }
  // Ensure history never starts with a tool_result (orphaned from a trimmed tool_use)
  while (messages.length > 0) {
    const first = messages[0];
    const hasOrphanedToolResult = Array.isArray(first.content) &&
      first.content.some(b => b.type === 'tool_result');
    if (hasOrphanedToolResult) {
      messages.splice(0, 2);
    } else {
      break;
    }
  }
}

// ── MCP + Anthropic setup ───────────────────────────────────────────────────

const transport = new StdioClientTransport({
  command: 'node',
  args: ['--experimental-strip-types', DISCORD_SERVER],
  env: { ...process.env, DISCORD_STATE_DIR: STATE_DIR },
  stderr: 'pipe',
});

const mcpClient = new Client(
  { name: `agent-${BOT_NAME}`, version: '1.0.0' },
  { capabilities: {} }
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Agent loop ───────────────────────────────────────────────────────────────

let cachedTools = null;

async function getTools() {
  if (cachedTools) return cachedTools;
  const { tools } = await mcpClient.listTools();
  cachedTools = tools.map(t => ({
    name:         t.name,
    description:  t.description,
    input_schema: t.inputSchema,
  }));
  cachedTools.push({
    name:         'send_email',
    description:  'Send an email to a recipient via Resend. Use this to follow up with leads or send confirmations.',
    input_schema: {
      type:       'object',
      properties: {
        to:      { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string', description: 'Email subject line' },
        html:    { type: 'string', description: 'HTML body of the email' },
      },
      required: ['to', 'subject', 'html'],
    },
  });
  return cachedTools;
}

// Classify a reply to get a meaningful action type for the dashboard
function detectActionType(text) {
  const t = text.toLowerCase();
  if (/book|schedul|appointment|calendar|time slot|available/.test(t)) return 'appointment';
  if (/lead|interest|follow.?up|contact|reach out|demo|quote/.test(t)) return 'lead';
  if (/email|sent|newsletter|campaign|drip/.test(t)) return 'email';
  return 'reply';
}

async function handleMessage(content, meta) {
  const { chat_id, message_id, user, ts } = meta;
  log(`Message from ${user}: ${content.slice(0, 100)}`);

  const history  = getHistory(chat_id);
  const tools    = await getTools();

  // Build the user turn with Discord channel context
  const userContent = [
    {
      type: 'text',
      text: `<channel source="discord" chat_id="${chat_id}" message_id="${message_id}" user="${user}" ts="${ts}">${content}</channel>`,
    },
  ];
  history.push({ role: 'user', content: userContent });

  let iterations = 0;
  while (iterations++ < 10) {
    let response;
    try {
      response = await anthropic.messages.create({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system:     soul,
        tools,
        messages:   history,
      });
    } catch (err) {
      if (err.message.includes('tool_use_id') || err.message.includes('tool_result')) {
        log(`History corruption detected — clearing chat history for ${chat_id}`);
        conversations.delete(chat_id);
      } else {
        log(`Anthropic API error: ${err.message}`);
      }
      break;
    }

    history.push({ role: 'assistant', content: response.content });
    trimHistory(history);

    if (response.stop_reason === 'end_turn') {
      // If Claude returned text without calling reply, send it automatically
      const textBlocks = response.content.filter(b => b.type === 'text' && b.text.trim());
      const calledReply = response.content.some(b => b.type === 'tool_use' && b.name === 'reply');
      if (textBlocks.length > 0 && !calledReply) {
        const text = textBlocks.map(b => b.text).join('\n').trim();
        try {
          await mcpClient.callTool({
            name: 'reply',
            arguments: { chat_id, text, reply_to: message_id },
          });
          log('Auto-sent final response to Discord.');
          await logActivity({
            botName: BOT_NAME, actionType: 'reply',
            chatId: chat_id, messageId: message_id,
            content: text,
          });
        } catch (err) {
          log(`Failed to auto-send response: ${err.message}`);
        }
      }
      log('Response complete.');
      break;
    }

    if (response.stop_reason === 'tool_use') {
      const toolResults = [];

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;
        log(`Tool: ${block.name}(${JSON.stringify(block.input).slice(0, 80)})`);

        // Log tool calls as activity
        if (block.name === 'reply') {
          const actionType = detectActionType(block.input.text || '');
          await logActivity({
            botName: BOT_NAME, actionType,
            chatId: block.input.chat_id || meta.chat_id,
            messageId: block.input.reply_to || meta.message_id,
            content: block.input.text,
          });
          if (actionType === 'lead') {
            notifyLeadCaptured({
              botDisplay:   config.display,
              userName:     meta.user,
              businessName: 'Not provided',
              messageText:  content,
            }).catch(err => log(`notifyLeadCaptured error: ${err.message}`));
            insertLead({
              botName:  BOT_NAME,
              name:     meta.user,
              business: null,
              message:  content,
            }).catch(err => log(`insertLead error: ${err.message}`));
          }
        }

        let resultText;
        if (block.name === 'send_email') {
          try {
            const result = await sendEmail(block.input);
            resultText = JSON.stringify(result);
            log(`Email sent to ${block.input.to}`);
            await logActivity({
              botName: BOT_NAME, actionType: 'email',
              chatId: meta.chat_id, messageId: meta.message_id,
              content: block.input.subject,
            });
          } catch (err) {
            resultText = `Error: ${err.message}`;
          }
        } else {
          try {
            const result = await mcpClient.callTool({
              name:      block.name,
              arguments: block.input,
            });
            const parts = result.content;
            resultText = Array.isArray(parts) && parts.length > 0
              ? (parts[0].text ?? JSON.stringify(parts[0]))
              : JSON.stringify(parts);
          } catch (err) {
            resultText = `Error: ${err.message}`;
          }
        }

        toolResults.push({
          type:        'tool_result',
          tool_use_id: block.id,
          content:     resultText,
        });
      }

      history.push({ role: 'user', content: toolResults });
    } else {
      break;
    }
  }
}

// ── Notification schema ──────────────────────────────────────────────────────

const ChannelNotificationSchema = z.object({
  method: z.literal('notifications/claude/channel'),
  params: z.object({
    content: z.string(),
    meta: z.object({
      chat_id:          z.string(),
      message_id:       z.string(),
      user:             z.string(),
      user_id:          z.string().optional(),
      ts:               z.string(),
      attachment_count: z.string().optional(),
      attachments:      z.string().optional(),
    }),
  }),
});

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log('Starting agent...');

  await mcpClient.connect(transport);
  log('Discord MCP connected.');

  // Log discord server stderr (gateway status, errors)
  if (transport.stderr) {
    transport.stderr.on('data', (chunk) => {
      const line = chunk.toString().trim();
      if (line) log(`[discord] ${line}`);
    });
  }

  mcpClient.setNotificationHandler(ChannelNotificationSchema, async (notification) => {
    const { content, meta } = notification.params;
    handleMessage(content, meta).catch(err =>
      log(`Error handling message: ${err.message}`)
    );
  });

  log('Listening for Discord messages. Press Ctrl+C to stop.');

  process.on('SIGINT', () => {
    log('Shutting down...');
    process.exit(0);
  });
}

main().catch(err => {
  console.error(`[${config.display}] Fatal: ${err.message}`);
  process.exit(1);
});
