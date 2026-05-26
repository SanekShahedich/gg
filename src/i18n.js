/** Локалізація відповіді бота (uk / ru / en) */

const TEXT = {
  uk: {
    searching: '🔍 Шукаю аніме…',
    notFound: '❌ Аніме не знайдено. Спробуйте іншу назву або перевірте написання.',
    error: '⚠️ Не вдалося отримати дані. Спробуйте пізніше.',
    help: `👋 Надішліть назву аніме — отримаєте статус, рейтинг, опис і кількість серій.

Після відповіді з’являться кнопки «Зацікавило» (кошик) та «Скіп».

<code>/plans</code> — ваш список для перегляду.

Приклад: <code>Атака титанів</code> або <code>Death Note</code>`,
    btnInterested: 'Зацікавило',
    btnSkip: 'Скіп',
    addedToPlans: '✅ Додано до планів перегляду.',
    alreadyInPlans: 'ℹ️ Це аніме вже у ваших планах.',
    plansTitle: '📋 <b>Плани перегляду</b>',
    plansEmpty: '😔 На жаль, у вас ще немає планів.',
    greet: '👋 Привіт! Що шукаємо сьогодні?',
    animePrompt: '🔎 Напишіть назву аніме — і я покажу всю інформацію.',
    menuStart: 'Старт',
    menuAnime: 'Аніме',
    menuPlans: 'Плани',
    btnDeleteAll: '🗑 Видалити все',
    btnConfirmDeleteAll: '✅ Так, видалити все',
    btnCancel: '↩️ Скасувати',
    planRemoved: 'Видалено з планів.',
    plansCleared: 'Усі плани видалено.',
    plansTapToDelete: '\n\n<i>Натисніть 🗑 біля назви, щоб прибрати зі списку.</i>',
    status: 'Статус',
    rating: 'Рейтинг',
    episodes: 'Серій',
    movies: 'Повнометражні фільми',
    description: 'Опис',
    noDescription: 'Опис відсутній.',
    noRating: 'немає оцінок',
    episodesUnknown: 'невідомо',
    didYouMean: 'Можливо, ви мали на увазі',
    statusMap: {
      FINISHED: 'Завершено',
      RELEASING: 'Виходить',
      NOT_YET_RELEASED: 'Ще не вийшло',
      CANCELLED: 'Скасовано',
      HIATUS: 'На паузі',
    },
    malStatusMap: {
      'Finished Airing': 'Завершено',
      'Currently Airing': 'Виходить',
      'Not yet aired': 'Ще не вийшло',
    },
  },
  ru: {
    searching: '🔍 Ищу аниме…',
    notFound: '❌ Аниме не найдено. Попробуйте другое название или проверьте написание.',
    error: '⚠️ Не удалось получить данные. Попробуйте позже.',
    help: `👋 Отправьте название аниме — получите статус, рейтинг, описание и количество серий.

После ответа появятся кнопки «Заинтересовало» и «Скип».

<code>/plans</code> — ваш список для просмотра.

Пример: <code>Атака титанов</code> или <code>Death Note</code>`,
    btnInterested: 'Заинтересовало',
    btnSkip: 'Скип',
    addedToPlans: '✅ Добавлено в планы просмотра.',
    alreadyInPlans: 'ℹ️ Это аниме уже в ваших планах.',
    plansTitle: '📋 <b>Планы просмотра</b>',
    plansEmpty: '😔 К сожалению, у вас пока нет планов.',
    greet: '👋 Привет! Что ищем сегодня?',
    animePrompt: '🔎 Напишите название аниме — и я покажу всю информацию.',
    menuStart: 'Старт',
    menuAnime: 'Аниме',
    menuPlans: 'Планы',
    btnDeleteAll: '🗑 Удалить всё',
    btnConfirmDeleteAll: '✅ Да, удалить всё',
    btnCancel: '↩️ Отмена',
    planRemoved: 'Удалено из планов.',
    plansCleared: 'Все планы удалены.',
    plansTapToDelete: '\n\n<i>Нажмите 🗑 у названия, чтобы убрать из списка.</i>',
    status: 'Статус',
    rating: 'Рейтинг',
    episodes: 'Серий',
    movies: 'Полнометражные фильмы',
    description: 'Описание',
    noDescription: 'Описание отсутствует.',
    noRating: 'нет оценок',
    episodesUnknown: 'неизвестно',
    didYouMean: 'Возможно, вы имели в виду',
    statusMap: {
      FINISHED: 'Завершено',
      RELEASING: 'Выходит',
      NOT_YET_RELEASED: 'Ещё не вышло',
      CANCELLED: 'Отменено',
      HIATUS: 'На паузе',
    },
    malStatusMap: {
      'Finished Airing': 'Завершено',
      'Currently Airing': 'Выходит',
      'Not yet aired': 'Ещё не вышло',
    },
  },
  en: {
    searching: '🔍 Searching for anime…',
    notFound: '❌ Anime not found. Try another title or check spelling.',
    error: '⚠️ Could not fetch data. Please try again later.',
    help: `👋 Send an anime title to get status, rating, synopsis, and episode count.

After the reply you’ll see «Interested» and «Skip» buttons.

<code>/plans</code> — your watchlist.

Example: <code>Attack on Titan</code> or <code>Death Note</code>`,
    btnInterested: 'Interested',
    btnSkip: 'Skip',
    addedToPlans: '✅ Added to your watchlist.',
    alreadyInPlans: 'ℹ️ This anime is already in your plans.',
    plansTitle: '📋 <b>Watchlist</b>',
    plansEmpty: '😔 Unfortunately, you don’t have any plans yet.',
    greet: '👋 Hi! What are we looking for today?',
    animePrompt: '🔎 Send an anime title and I’ll show you all the info.',
    menuStart: 'Start',
    menuAnime: 'Anime',
    menuPlans: 'Plans',
    btnDeleteAll: '🗑 Delete all',
    btnConfirmDeleteAll: '✅ Yes, delete all',
    btnCancel: '↩️ Cancel',
    planRemoved: 'Removed from your list.',
    plansCleared: 'All plans deleted.',
    plansTapToDelete: '\n\n<i>Tap 🗑 next to a title to remove it.</i>',
    status: 'Status',
    rating: 'Rating',
    episodes: 'Episodes',
    movies: 'Feature films',
    description: 'Synopsis',
    noDescription: 'No synopsis available.',
    noRating: 'no score yet',
    episodesUnknown: 'unknown',
    didYouMean: 'Did you mean',
    statusMap: {
      FINISHED: 'Finished',
      RELEASING: 'Airing',
      NOT_YET_RELEASED: 'Not yet aired',
      CANCELLED: 'Cancelled',
      HIATUS: 'On hiatus',
    },
    malStatusMap: {
      'Finished Airing': 'Finished',
      'Currently Airing': 'Airing',
      'Not yet aired': 'Not yet aired',
    },
  },
};

export function t(lang, key) {
  const pack = TEXT[lang] ?? TEXT.uk ?? TEXT.en;
  return pack[key] ?? TEXT.en[key] ?? key;
}

export function menuLabels(lang) {
  const pack = TEXT[lang] ?? TEXT.en;
  return {
    start: pack.menuStart,
    anime: pack.menuAnime,
    plans: pack.menuPlans,
  };
}

const ALL_MENU_TEXTS = new Set();
for (const pack of Object.values(TEXT)) {
  ALL_MENU_TEXTS.add(pack.menuStart);
  ALL_MENU_TEXTS.add(pack.menuAnime);
  ALL_MENU_TEXTS.add(pack.menuPlans);
}

export function isMenuButton(text) {
  return ALL_MENU_TEXTS.has(text?.trim());
}

export function menuAction(text) {
  const v = text?.trim();
  for (const [lang, pack] of Object.entries(TEXT)) {
    if (v === pack.menuStart) return { action: 'start', lang };
    if (v === pack.menuAnime) return { action: 'anime', lang };
    if (v === pack.menuPlans) return { action: 'plans', lang };
  }
  return null;
}

export function statusLabel(lang, malStatus, anilistStatus) {
  const pack = TEXT[lang] ?? TEXT.en;
  if (anilistStatus && pack.statusMap[anilistStatus]) {
    return pack.statusMap[anilistStatus];
  }
  if (malStatus && pack.malStatusMap[malStatus]) {
    return pack.malStatusMap[malStatus];
  }
  return malStatus ?? anilistStatus ?? '—';
}
