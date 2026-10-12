/* Тест Шульте (фрейм 6): вся механика теста - данные таблицы, состояние,
   обработка кликов, таймер, прогресс, тосты об ошибках и экран результатов. */
(function () {
  var section = document.querySelector('.schulte');
  if (!section) return;

  var COLOR_ORDER = [
    { value: 1, color: 'black' },
    { value: 12, color: 'red' },
    { value: 2, color: 'black' },
    { value: 11, color: 'red' },
    { value: 3, color: 'black' },
    { value: 10, color: 'red' },
    { value: 4, color: 'black' },
    { value: 9, color: 'red' },
    { value: 5, color: 'black' },
    { value: 8, color: 'red' },
    { value: 6, color: 'black' },
    { value: 7, color: 'red' },
    { value: 7, color: 'black' },
    { value: 6, color: 'red' },
    { value: 8, color: 'black' },
    { value: 5, color: 'red' },
    { value: 9, color: 'black' },
    { value: 4, color: 'red' },
    { value: 10, color: 'black' },
    { value: 3, color: 'red' },
    { value: 11, color: 'black' },
    { value: 2, color: 'red' },
    { value: 12, color: 'black' },
    { value: 1, color: 'red' },
    { value: 13, color: 'black' }
  ];

  function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = array[i];
      array[i] = array[j];
      array[j] = tmp;
    }
    return array;
  }

  function createShuffledCells() {
    return shuffleArray(
      COLOR_ORDER.map(function (item) {
        return { value: item.value, color: item.color };
      })
    );
  }

  var CELLS = createShuffledCells();

  // Интерпретация результата теста по времени прохождения (в секундах).
  var OUTCOME_TIERS = [
    {
      max: 25,
      icon: '⚡',
      title: 'Молниеносная реакция',
      text: 'Скорость обработки визуальной информации у вас на уровне профессиональных диспетчеров и пилотов. Мозг практически не тратит время на смену фокуса между чёрным и красным рядом чисел, а периферийное зрение работает на пределе физиологических возможностей. Такой результат - редкость даже среди тренированных испытуемых.'
    },
    {
      max: 40,
      icon: '🎉',
      title: 'Безупречный результат',
      text: 'Ваш мозг мгновенно переключается между разнородными задачами, игнорируя визуальный шум. Вы обладаете широким периферическим зрением и высокой помехоустойчивостью. Такой уровень когнитивного контроля минимизирует риск ошибок из-за невнимательности даже в стрессовых ситуациях.'
    },
    {
      max: 50,
      icon: '👍',
      title: 'Хорошая концентрация',
      text: 'Вы уверенно удерживаете внимание на задаче и без труда переключаетесь между двумя параллельными рядами чисел. Небольшое отставание от эталонного темпа не критично - на этом уровне ошибки по невнимательности случаются редко и не влияют на качество работы.'
    },
    {
      max: 65,
      icon: '💡',
      title: 'Есть над чем поработать',
      text: 'Переключение между чёрными и красными числами даётся с заметным усилием - мозгу требуется больше времени на смену фокуса внимания. Это не повод для тревоги, а скорее сигнал снизить многозадачность и добавить короткие перерывы в течение рабочего дня.'
    },
    {
      max: Infinity,
      icon: '☕',
      title: 'Повод для отдыха',
      text: 'Такой темп чаще всего говорит не о низких способностях, а об усталости, недосыпе или информационной перегрузке - именно они в первую очередь снижают скорость переключения внимания. Полноценный отдых и повторное прохождение теста в спокойном состоянии обычно всё расставляют по местам.'
    }
  ];

  function getOutcomeTier(seconds) {
    for (var i = 0; i < OUTCOME_TIERS.length; i++) {
      if (seconds <= OUTCOME_TIERS[i].max) return OUTCOME_TIERS[i];
    }
    return OUTCOME_TIERS[OUTCOME_TIERS.length - 1];
  }

  var state = {
    isStarted: false,
    isCompleted: false,
    currentStep: 0,
    totalClicks: 0,
    correctClicks: 0,
    errorClicks: 0,
    startTime: null,
    lastClickTime: null,
    timerInterval: null,
    elapsedSeconds: 0,
    toastTimeout: null
  };

  var $ = function (id) { return document.getElementById(id); };

  var introPanel = $('schulteIntroPanel');
  var rulesPanel = $('schulteRulesPanel');
  var startState = $('schulteStartState');
  var testState = $('schulteTestState');
  var startBtn = $('schulteStartBtn');
  var beginBtn = $('schulteBeginBtn');
  var backBtn = $('schulteBackBtn');
  var tableEl = $('schulteTable');
  var stepDisplay = $('schulteStep');
  var timeDisplay = $('schulteTime');
  var progressFill = $('schulteProgressFill');
  var outcomeState = $('schulteOutcomeState');
  var outcomeIcon = $('schulteOutcomeIcon');
  var outcomeTime = $('schulteOutcomeTime');
  var outcomeTitle = $('schulteOutcomeTitle');
  var outcomeText = $('schulteOutcomeText');
  var shareBtn = $('schulteShareBtn');
  var retryBtn = $('schulteRetryBtn');
  var toast = $('schulteToast');
  var toastMessage = $('schulteToastMessage');
  var toastHint = $('schulteToastHint');

  if (!tableEl || !startBtn) return;

  function renderTable() {
    tableEl.innerHTML = '';
    CELLS.forEach(function (cell, index) {
      var div = document.createElement('div');
      div.className = 'schulte-cell schulte-cell-' + cell.color;
      div.dataset.index = index;
      div.dataset.value = cell.value;
      div.dataset.color = cell.color;
      div.textContent = cell.value;
      div.addEventListener('click', function () { handleCellClick(index); });
      tableEl.appendChild(div);
    });
  }

  // Новая случайная раскладка тех же 25 клеток: используется и при
  // каждом заходе в тест ("Пройти тест" / "Заново")
  function reshuffleTable() {
    CELLS = createShuffledCells();
    renderTable();
  }

  function getAllCells() {
    return tableEl.querySelectorAll('.schulte-cell');
  }

  function getCellElement(index) {
    return tableEl.querySelector('[data-index="' + index + '"]');
  }

  function showToast(message, hint, variant) {
    if (!toast) return;
    if (state.toastTimeout) {
      clearTimeout(state.toastTimeout);
      state.toastTimeout = null;
    }
    toast.classList.remove('is-visible');

    setTimeout(function () {
      toastMessage.textContent = message;
      toastHint.textContent = hint || '';
      toast.classList.toggle('schulte-toast-neutral', variant === 'neutral');
      toast.classList.add('is-visible');

      state.toastTimeout = setTimeout(function () {
        toast.classList.remove('is-visible');
        state.toastTimeout = null;
      }, 2500);
    }, 80);
  }

  function hideToast() {
    if (!toast) return;
    if (state.toastTimeout) {
      clearTimeout(state.toastTimeout);
      state.toastTimeout = null;
    }
    toast.classList.remove('is-visible');
  }

  function updateProgress() {
    var progress = (state.currentStep / COLOR_ORDER.length) * 100;
    progressFill.style.width = Math.min(progress, 100) + '%';
  }

  // Кнопка "Начать"/"Заново" объединена: до запуска теста она в режиме
  // "start" (запускает тест), после запуска - в режиме "reset"
  // (сбрасывает тест на новую раскладку).
  var beginMode = 'start';

  function setBeginMode(mode) {
    beginMode = mode;
    if (!beginBtn) return;
    beginBtn.textContent = mode === 'start' ? 'Начать' : 'Заново';
    beginBtn.disabled = false;
  }

  function handleBeginClick() {
    if (beginMode === 'start') {
      startTest();
    } else {
      resetTest();
    }
  }

  function resetState() {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
    hideToast();
    state.isStarted = false;
    state.isCompleted = false;
    state.currentStep = 0;
    state.totalClicks = 0;
    state.correctClicks = 0;
    state.errorClicks = 0;
    state.startTime = null;
    state.lastClickTime = null;
    state.elapsedSeconds = 0;
  }

  function showRulesPanel() {
    if (introPanel) introPanel.hidden = true;
    if (rulesPanel) rulesPanel.hidden = false;
  }

  function showIntroPanel() {
    if (rulesPanel) rulesPanel.hidden = true;
    if (introPanel) introPanel.hidden = false;
  }

  function prepareCells() {
    getAllCells().forEach(function (cell) {
      cell.className = 'schulte-cell schulte-cell-' + cell.dataset.color;
    });
  }

  // Общий сброс экрана теста в состояние "готов к старту": новая случайная
  // раскладка чисел (или просто снятие пометок с текущей, если reshuffle
  // выключен), обнулённые счётчики/таймер/прогресс, доступная "Начать".
  function resetTestScreen(reshuffle) {
    resetState();
    if (reshuffle === false) {
      prepareCells();
    } else {
      reshuffleTable();
    }

    tableEl.classList.remove('is-dimmed');
    if (outcomeState) outcomeState.hidden = true;
    if (testState) testState.hidden = false;

    stepDisplay.textContent = 'Шаг 0 из ' + COLOR_ORDER.length;
    timeDisplay.textContent = '0 сек';
    progressFill.style.width = '0%';

    setBeginMode('start');
  }

  function openTestPanel() {
    resetTestScreen();
    showRulesPanel();
  }

  function startTest() {
    if (state.isStarted) return;

    resetState();
    prepareCells();

    state.isStarted = true;
    state.startTime = Date.now();
    state.lastClickTime = Date.now();

    tableEl.classList.remove('is-dimmed');

    stepDisplay.textContent = 'Шаг ' + (state.currentStep + 1) + ' из ' + COLOR_ORDER.length;
    timeDisplay.textContent = '0 сек';
    progressFill.style.width = '0%';

    setBeginMode('reset');

    if (state.timerInterval) clearInterval(state.timerInterval);
    state.timerInterval = setInterval(function () {
      state.elapsedSeconds++;
      timeDisplay.textContent = state.elapsedSeconds + ' сек';
    }, 1000);
  }

  function handleCellClick(index) {
    if (!state.isStarted || state.isCompleted) return;

    var cell = getCellElement(index);
    if (!cell) return;

    var isCompleted = cell.classList.contains('is-completed');
    var cellValue = parseInt(cell.dataset.value, 10);
    var cellColor = cell.dataset.color;
    var expected = COLOR_ORDER[state.currentStep];
    var isCorrect = !isCompleted && cellValue === expected.value && cellColor === expected.color;

    var now = Date.now();
    state.totalClicks++;

    if (isCorrect) {
      state.correctClicks++;
      cell.classList.add('is-completed');
      state.currentStep++;

      updateProgress();
      stepDisplay.textContent = 'Шаг ' + (state.currentStep + 1) + ' из ' + COLOR_ORDER.length;

      if (state.currentStep >= COLOR_ORDER.length) {
        completeTest();
      }
    } else {
      state.errorClicks++;
      var colorText = expected.color === 'black' ? 'чёрное' : 'красное';
      showToast('Ошибка!', 'Нужно нажать: ' + expected.value + ' ' + colorText);

      cell.classList.add('is-error');
      setTimeout(function () {
        cell.classList.remove('is-error');
      }, 350);
    }

    state.lastClickTime = now;
  }

  function completeTest() {
    state.isCompleted = true;
    state.isStarted = false;
    hideToast();

    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }

    setBeginMode('reset');

    stepDisplay.textContent = 'Тест завершён';

    tableEl.classList.add('is-dimmed');
    setTimeout(showOutcome, 750);
  }

  function showOutcome() {
    var tier = getOutcomeTier(state.elapsedSeconds);

    if (outcomeIcon) outcomeIcon.textContent = tier.icon;
    if (outcomeTime) outcomeTime.textContent = state.elapsedSeconds + ' сек';
    if (outcomeTitle) outcomeTitle.textContent = tier.title;
    if (outcomeText) outcomeText.textContent = tier.text;

    if (testState) testState.hidden = true;
    if (outcomeState) outcomeState.hidden = false;
  }

  function shareResult() {
    var tier = getOutcomeTier(state.elapsedSeconds);
    var text = 'Тест Шульте: ' + state.elapsedSeconds + ' сек — ' + tier.title;

    if (navigator.share) {
      navigator.share({ text: text }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () {
        showToast('Скопировано', 'Результат скопирован в буфер обмена', 'neutral');
      });
    }
  }

  function resetTest() {
    openTestPanel();
  }

  function goToStart() {
    resetState();
    hideToast();
    tableEl.classList.remove('is-dimmed');
    if (outcomeState) outcomeState.hidden = true;
    if (testState) testState.hidden = true;
    if (startState) startState.hidden = false;
    showIntroPanel();
  }

  renderTable();

  startBtn.addEventListener('click', function () {
    startState.hidden = true;
    testState.hidden = false;
    openTestPanel();
  });

  if (beginBtn) beginBtn.addEventListener('click', handleBeginClick);
  if (backBtn) backBtn.addEventListener('click', goToStart);
  if (retryBtn) retryBtn.addEventListener('click', resetTest);
  if (shareBtn) shareBtn.addEventListener('click', shareResult);
})();
