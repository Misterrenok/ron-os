(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('visual-audit') !== '1') return;

  const now = new Date('2026-09-13T17:00:00.000Z');
  const iso = (minutes) => new Date(now.getTime() + minutes * 60_000).toISOString();

  const snapshot = {
    event_count: 28,
    state: {
      profile: {
        initialized: true,
        economy_status: 'CALIBRATED',
        rank: 'E',
        level: 2,
        xp: 615,
        xp_to_next: 385,
        coins: 7
      },
      attributes: { STR: 3, VIT: 4, INT: 6, DISC: 5, CHA: 3 },
      attribute_meta: {
        STR: { claim: 'VERIFIED' },
        VIT: { claim: 'VERIFIED' },
        INT: { claim: 'VERIFIED' },
        DISC: { claim: 'VERIFIED' },
        CHA: { claim: 'REPORTED' }
      },
      quests: [
        {
          id: 'audit-quest-main',
          quest_version: 2,
          title: 'Немецкий: первый урок Nicos Weg A1 — Hallo!',
          description: 'Завершить первый полноценный урок и подтвердить результат без подсказок.',
          status: 'ACTIVE',
          visibility: 'VISIBLE',
          rank: 'D',
          class: 'RECOVERY',
          reward_xp: 10,
          reward_coins: 0,
          soft_target_at: iso(-90),
          deadline_at: null,
          objectives: [
            { title: 'Пройти урок и упражнения целиком', progress: 1, target: 1, unit: 'lesson', required: true },
            { title: 'Назвать 3 немецкие фразы с русскими значениями без подсказок', progress: 1, target: 3, unit: 'phrases', required: true }
          ]
        },
        {
          id: 'audit-quest-long',
          quest_version: 2,
          title: 'Проверка очень длинного названия задания на мобильном экране без обрезки и горизонтального переполнения карточки',
          description: 'Стресс-тест плотности текста, бейджей, прогресса и метаданных на узком экране.',
          status: 'ACTIVE',
          visibility: 'VISIBLE',
          rank: 'B',
          class: 'MAIN',
          reward_xp: 40,
          reward_coins: 2,
          soft_target_at: iso(180),
          deadline_at: null,
          objectives: [
            { title: 'Очень длинная формулировка обязательной цели для проверки переноса строки внутри карточки задания на телефоне', progress: 2, target: 5, unit: 'count', required: true },
            { title: 'Вторая цель', progress: 0, target: 1, unit: 'check', required: true }
          ]
        }
      ],
      skills: [
        { id: 'skill-turkish', name: 'Turkish', level: 3, active: true },
        { id: 'skill-marketplace', name: 'Marketplace Operations', level: 3, active: true },
        { id: 'skill-long', name: 'Очень длинное название навыка для проверки мобильного переноса текста', level: 2, active: false }
      ],
      achievements: [
        {
          id: 'audit-achievement-1',
          title: 'Первое подтверждённое завершение Quest v2 с длинным названием этапа',
          description: 'Стресс-тест карточки достижения и раскрывающихся деталей.',
          rank: 'D',
          unlocked_at: iso(-1440),
          evidence_ref: 'visual-audit-fixture'
        }
      ],
      shop: [
        {
          id: 'audit-shop-1',
          title: 'Косметическая тема интерфейса с длинным названием',
          description: 'Только визуальный внутренний эффект без внешней покупки.',
          cost_coins: 5,
          active: true,
          repeatable: false,
          redemptions: 0,
          last_redeemed_at: null
        },
        {
          id: 'audit-shop-2',
          title: 'Акцент профиля',
          description: 'Ещё одна карточка для проверки плотности магазина.',
          cost_coins: 12,
          active: false,
          repeatable: false,
          redemptions: 1,
          last_redeemed_at: iso(-2880)
        }
      ],
      notifications: [
        {
          id: 'audit-notification-critical',
          title: 'Проверка длинного системного предупреждения на мобильном экране',
          body: 'Это демонстрационное сообщение для визуального аудита переноса текста, кнопок, бейджа и раскрывающихся деталей. Никакого реального события оно не отражает.',
          kind: 'visual-audit',
          severity: 'CRITICAL',
          status: 'UNREAD',
          pushed_at: iso(-30),
          acknowledged_at: null
        },
        {
          id: 'audit-notification-info',
          title: 'Обычное системное сообщение',
          body: 'Второй элемент списка проверяет вертикальную плотность экрана сообщений.',
          kind: 'visual-audit',
          severity: 'INFO',
          status: 'READ',
          pushed_at: iso(-360),
          acknowledged_at: iso(-300)
        }
      ],
      log: [
        { id: 'audit-event-1', event_id: 'audit-event-1', type: 'quest.created', occurred_at: iso(-720), claim_status: 'VERIFIED', source: 'system-controller', source_ref: 'visual-audit-fixture' },
        { id: 'audit-event-2', event_id: 'audit-event-2', type: 'quest.progressed', occurred_at: iso(-300), claim_status: 'VERIFIED', source: 'system-controller', source_ref: 'visual-audit-fixture' },
        { id: 'audit-event-3', event_id: 'audit-event-3', type: 'notification.pushed', occurred_at: iso(-30), claim_status: 'DERIVED', source: 'system-api', source_ref: 'visual-audit-fixture' },
        { id: 'audit-event-4', event_id: 'audit-event-4', type: 'skill.upserted', occurred_at: iso(-20), claim_status: 'VERIFIED', source: 'system-controller', source_ref: 'visual-audit-fixture-with-a-deliberately-long-source-reference-to-test-wrapping' }
      ]
    }
  };

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, window.location.href);
    const method = String(init.method || (typeof input === 'object' && input.method) || 'GET').toUpperCase();

    if (url.origin === window.location.origin && url.pathname.startsWith('/api/')) {
      if (method !== 'GET') {
        return new Response(JSON.stringify({ error: 'VISUAL_AUDIT_READ_ONLY' }), {
          status: 403,
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.pathname === '/api/v1/snapshot') {
        return new Response(JSON.stringify(snapshot), {
          status: 200,
          headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
        });
      }
      if (url.pathname === '/api/v1/push/public-key') {
        return new Response(JSON.stringify({ enabled: false, public_key: null }), {
          status: 200,
          headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
        });
      }
      return new Response(JSON.stringify({ error: 'VISUAL_AUDIT_ENDPOINT_BLOCKED' }), {
        status: 404,
        headers: { 'content-type': 'application/json' }
      });
    }

    return nativeFetch(input, init);
  };

  document.documentElement.dataset.visualAudit = 'true';
  console.info('Ron System visual-audit preview active: synthetic data, API writes blocked.');
})();
