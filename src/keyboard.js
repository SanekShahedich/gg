import { t, menuLabels } from './i18n.js';

/** Постійна панель внизу чату */
export function mainMenuKeyboard(lang) {
  const { start, anime, plans } = menuLabels(lang);
  return {
    keyboard: [[{ text: start }, { text: anime }, { text: plans }]],
    resize_keyboard: true,
    is_persistent: true,
  };
}

/** Inline-кнопки лише під повідомленням бота з інфо про аніме */
export function animeResultKeyboard(lang, malId) {
  return {
    inline_keyboard: [
      [
        { text: t(lang, 'btnInterested'), callback_data: `plan:${malId}` },
        { text: t(lang, 'btnSkip'), callback_data: 'skip' },
      ],
    ],
  };
}

export function emptyInlineKeyboard() {
  return { inline_keyboard: [] };
}

function truncateBtn(text, max = 38) {
  const s = String(text ?? '').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

/** Кнопки видалення під списком планів (повідомлення бота) */
export function plansManageKeyboard(lang, plans) {
  if (!plans.length) return null;

  const rows = plans.map((p) => [
    {
      text: `🗑 ${truncateBtn(p.title)}`,
      callback_data: `rm:${p.malId}`,
    },
  ]);

  rows.push([{ text: t(lang, 'btnDeleteAll'), callback_data: 'delall' }]);
  return { inline_keyboard: rows };
}

export function plansDeleteAllConfirmKeyboard(lang) {
  return {
    inline_keyboard: [
      [{ text: t(lang, 'btnConfirmDeleteAll'), callback_data: 'delall_y' }],
      [{ text: t(lang, 'btnCancel'), callback_data: 'delall_n' }],
    ],
  };
}
