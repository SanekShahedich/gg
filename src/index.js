import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { lookupAnime } from './animeService.js';
import { detectLanguage } from './language.js';
import { t, menuAction, isMenuButton } from './i18n.js';
import {
  animeResultKeyboard,
  emptyInlineKeyboard,
  mainMenuKeyboard,
  plansManageKeyboard,
  plansDeleteAllConfirmKeyboard,
} from './keyboard.js';
import { addPlan, getPlans, removePlan, clearAllPlans } from './plans.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('Встановіть TELEGRAM_BOT_TOKEN у файлі .env');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

const resultContext = new Map();
const userLang = new Map();

function contextKey(chatId, messageId) {
  return `${chatId}:${messageId}`;
}

function storeResultContext(chatId, messageId, data) {
  const key = contextKey(chatId, messageId);
  resultContext.set(key, data);
  setTimeout(() => resultContext.delete(key), 60 * 60 * 1000);
}

function getResultContext(chatId, messageId) {
  return resultContext.get(contextKey(chatId, messageId));
}

function setLang(userId, lang) {
  userLang.set(userId, lang);
}

function getLang(userId, fallback = 'uk') {
  return userLang.get(userId) ?? fallback;
}

function detectLangFromUser(msg, fallback = 'uk') {
  if (msg?.text && !isMenuButton(msg.text)) return detectLanguage(msg.text);
  const code = msg?.from?.language_code ?? '';
  if (code.startsWith('uk')) return 'uk';
  if (code.startsWith('ru')) return 'ru';
  if (code.startsWith('en')) return 'en';
  return fallback;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatPlansList(lang, plans, withHint = false) {
  if (!plans.length) return t(lang, 'plansEmpty');
  const lines = plans.map((p, i) => `${i + 1}. ${escapeHtml(p.title)}`);
  const hint = withHint ? t(lang, 'plansTapToDelete') : '';
  return `${t(lang, 'plansTitle')}\n\n${lines.join('\n')}${hint}`;
}

async function sendWithMenu(chatId, userId, lang, text, extra = {}) {
  setLang(userId, lang);
  await bot.sendMessage(chatId, text, {
    parse_mode: extra.parse_mode ?? 'HTML',
    reply_markup: mainMenuKeyboard(lang),
    ...extra,
  });
}

async function refreshPlansMessage(chatId, messageId, userId, lang) {
  const plans = await getPlans(userId);
  const text = formatPlansList(lang, plans, plans.length > 0);
  const inline = plansManageKeyboard(lang, plans);

  await bot.editMessageText(text, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'HTML',
    reply_markup: inline ?? emptyInlineKeyboard(),
  });
}

async function sendPlans(chatId, userId, lang) {
  const plans = await getPlans(userId);
  const text = formatPlansList(lang, plans, plans.length > 0);
  const inline = plansManageKeyboard(lang, plans);

  setLang(userId, lang);

  if (!plans.length) {
    await sendWithMenu(chatId, userId, lang, text);
    return;
  }

  await bot.sendMessage(chatId, text, {
    parse_mode: 'HTML',
    reply_markup: inline,
  });
}

async function handleStart(chatId, userId, lang) {
  await sendWithMenu(chatId, userId, lang, t(lang, 'greet'));
}

async function handleAnimePrompt(chatId, userId, lang) {
  await sendWithMenu(chatId, userId, lang, t(lang, 'animePrompt'));
}

async function searchAndReply(chatId, userId, query, langHint) {
  const lang = langHint ?? getLang(userId, 'uk');
  setLang(userId, lang);

  let statusMsg;
  try {
    statusMsg = await bot.sendMessage(chatId, t(lang, 'searching'), {
      reply_markup: mainMenuKeyboard(lang),
    });
  } catch {
    return;
  }

  try {
    const result = await lookupAnime(query);

    await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});

    if (!result.ok) {
      await sendWithMenu(chatId, userId, lang, t(lang, 'notFound'));
      return;
    }

    setLang(userId, result.lang);

    const botMsg = await bot.sendMessage(chatId, result.message, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: animeResultKeyboard(result.lang, result.malId),
    });

    storeResultContext(chatId, botMsg.message_id, {
      malId: result.malId,
      titleLine: result.titleLine,
      lang: result.lang,
    });
  } catch (err) {
    console.error(err);
    await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});
    await sendWithMenu(chatId, userId, lang, t(lang, 'error'));
  }
}

bot.onText(/\/start/, async (msg) => {
  const lang = detectLangFromUser(msg, 'uk');
  await handleStart(msg.chat.id, msg.from.id, lang);
});

bot.onText(/\/help/, async (msg) => {
  const lang = getLang(msg.from.id, detectLangFromUser(msg, 'uk'));
  await sendWithMenu(msg.chat.id, msg.from.id, lang, t(lang, 'help'));
});

bot.onText(/\/plans/, async (msg) => {
  const lang = getLang(msg.from.id, detectLangFromUser(msg, 'uk'));
  await sendPlans(msg.chat.id, msg.from.id, lang);
});

bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat?.id;
  const messageId = query.message?.message_id;
  const userId = query.from?.id;
  if (!chatId || !messageId || !userId) {
    await bot.answerCallbackQuery(query.id).catch(() => {});
    return;
  }

  const ctx = getResultContext(chatId, messageId);
  const lang = ctx?.lang ?? getLang(userId, 'uk');
  const data = query.data ?? '';

  try {
    if (data === 'skip') {
      await bot.editMessageReplyMarkup(emptyInlineKeyboard(), {
        chat_id: chatId,
        message_id: messageId,
      });
      resultContext.delete(contextKey(chatId, messageId));
      await bot.answerCallbackQuery(query.id);
      return;
    }

    if (data.startsWith('plan:')) {
      const malId = Number.parseInt(data.slice(5), 10);
      const title = ctx?.titleLine ?? `MAL #${malId}`;
      const { added } = await addPlan(userId, { malId, title });

      await bot.editMessageReplyMarkup(emptyInlineKeyboard(), {
        chat_id: chatId,
        message_id: messageId,
      });
      resultContext.delete(contextKey(chatId, messageId));

      await bot.answerCallbackQuery(query.id, {
        text: added ? t(lang, 'addedToPlans') : t(lang, 'alreadyInPlans'),
        show_alert: false,
      });
      return;
    }

    if (data.startsWith('rm:')) {
      const malId = Number.parseInt(data.slice(3), 10);
      await removePlan(userId, malId);
      await refreshPlansMessage(chatId, messageId, userId, lang);
      await bot.answerCallbackQuery(query.id, { text: t(lang, 'planRemoved') });
      return;
    }

    if (data === 'delall') {
      await bot.editMessageReplyMarkup(plansDeleteAllConfirmKeyboard(lang), {
        chat_id: chatId,
        message_id: messageId,
      });
      await bot.answerCallbackQuery(query.id);
      return;
    }

    if (data === 'delall_n') {
      const plans = await getPlans(userId);
      const inline = plansManageKeyboard(lang, plans);
      await bot.editMessageReplyMarkup(inline ?? emptyInlineKeyboard(), {
        chat_id: chatId,
        message_id: messageId,
      });
      await bot.answerCallbackQuery(query.id);
      return;
    }

    if (data === 'delall_y') {
      await clearAllPlans(userId);
      await bot.editMessageText(t(lang, 'plansEmpty'), {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML',
        reply_markup: emptyInlineKeyboard(),
      });
      await bot.answerCallbackQuery(query.id, { text: t(lang, 'plansCleared') });
      return;
    }

    await bot.answerCallbackQuery(query.id);
  } catch (err) {
    console.error(err);
    await bot.answerCallbackQuery(query.id).catch(() => {});
  }
});

bot.on('message', async (msg) => {
  const text = msg.text?.trim();
  if (!text || text.startsWith('/')) return;

  const userId = msg.from.id;
  const chatId = msg.chat.id;

  const menu = menuAction(text);
  if (menu) {
    setLang(userId, menu.lang);
    if (menu.action === 'start') {
      await handleStart(chatId, userId, menu.lang);
      return;
    }
    if (menu.action === 'anime') {
      await handleAnimePrompt(chatId, userId, menu.lang);
      return;
    }
    if (menu.action === 'plans') {
      await sendPlans(chatId, userId, menu.lang);
      return;
    }
  }

  const lang = detectLanguage(text);
  setLang(userId, lang);
  await searchAndReply(chatId, userId, text, lang);
});

bot
  .setMyCommands([
    { command: 'start', description: 'Запуск / панель кнопок' },
    { command: 'plans', description: 'Плани перегляду' },
  ])
  .catch(() => {});

console.log('Anime bot запущено. Натисніть /start у Telegram.');
