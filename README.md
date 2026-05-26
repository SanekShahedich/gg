# Anime Telegram Bot

Telegram-бот на Node.js: за назвою аніме показує **статус**, **рейтинг**, **опис**, **кількість серій** і **оригінальну назву в дужках**. Відповідає тією ж мовою, якою ви написали запит (українська / російська / англійська).

## Джерела даних

- [MyAnimeList](https://myanimelist.net/) через офіційний неофіційний API [Jikan v4](https://jikan.moe/)
- [AniList](https://anilist.co/) GraphQL API
- [Shikimori](https://shikimori.one/) (лише для uk/ru — описи російською, синхрон з MAL)

Усі три каталоги прив’язані до MyAnimeList і використовуються в аніме-спільноті як надійні.

## Нечіткий пошук

Якщо в назві помилка в літері, бот все одно знаходить потрібне аніме (Fuse.js + відстань Левенштейна + синоніми з обох API).

## Встановлення

1. Node.js 18+
2. Створіть бота в [@BotFather](https://t.me/BotFather) і скопіюйте токен.
3. У папці проєкту:

```bash
npm install
copy .env.example .env
```

4. Відкрийте `.env` і вставте токен:

```
TELEGRAM_BOT_TOKEN=123456:ABC...
```

5. Запуск:

```bash
npm start
```

## Використання

Надішліть боту назву, наприклад:

- `Атака титанів`
- `Naruto`
- `Deth Note` (з помилкою — знайде Death Note)

**Панель внизу:** Старт · Аніме · Плани (з’являється після `/start`).

**Під карткою аніме** (лише в повідомленні бота): Зацікавило · Скіп.

## GitHub

Репозиторій: [github.com/SanekShahedich/gg](https://github.com/SanekShahedich/gg)

Після встановлення [Git](https://git-scm.com/download/win) у папці проєкту:

```powershell
.\push-to-github.ps1
```

Або вручну:

```powershell
git init
git branch -M main
git remote add origin https://github.com/SanekShahedich/gg.git
git add .
git commit -m "Anime Telegram bot"
git push -u origin main
```

Файл `.env` з токеном **не потрапляє** в репозиторій (є в `.gitignore`).
