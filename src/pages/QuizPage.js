import { QUESTIONS, QUESTIONS_BY_DIFFICULTY, QUESTIONS_PER_ROUND, QUIZ_DIFFICULTIES } from '../data/quiz.js';
import { pageFooter } from '../components/Footer.js';
import { icon } from '../components/icons.js';
import { store } from '../systems/store.js';
import { shuffle } from '../utils/format.js';

const letter = (index) => String.fromCharCode(65 + index);

const prepareQuestion = (question) => {
  const options = shuffle(
    question.options.map((text, index) => ({ text, correct: index === question.answer })),
  );
  return { ...question, options };
};

const prepareRound = (difficultyId) =>
  shuffle(QUESTIONS_BY_DIFFICULTY[difficultyId]).slice(0, QUESTIONS_PER_ROUND).map(prepareQuestion);

const feedbackCopy = (percent) => {
  if (percent >= 88) return { title: 'Flight Director material.', copy: 'Outstanding command of the material. Your answers are logged in the flight record.' };
  if (percent >= 63) return { title: 'Strong orbital knowledge.', copy: 'A confident result. Review the briefings below to close the remaining gaps.' };
  if (percent >= 38) return { title: 'Solid start.', copy: 'You have the fundamentals. A second round will sharpen the details.' };
  return { title: 'Keep exploring.', copy: 'Review each explanation below, then run another round. Planetary science rewards repetition.' };
};

const bestFor = (history, difficultyId) =>
  history
    .filter((attempt) => attempt.difficulty === difficultyId)
    .reduce((best, attempt) => Math.max(best, attempt.percent), -1);

export async function mount(root, ctx) {
  const initialSnapshot = store.getState();
  const history = initialSnapshot.quiz.history;
  const overallBest = initialSnapshot.quiz.attempts ? `${initialSnapshot.quiz.bestPercent}%` : '—';

  root.innerHTML = `
    <div class="page-shell quiz-page">
      <header class="page-topbar">
        <div class="breadcrumb">
          <a href="#/">ORBIT X</a><span>/</span><span>FLIGHT ACADEMY</span>
          <span class="archive-tag">${icon('quiz', 12)} ${QUESTIONS.length} QUESTION BANK</span>
        </div>
        <div class="quiz-topstats">
          <span>BEST <b>${overallBest}</b></span>
          <span>ATTEMPTS <b>${initialSnapshot.quiz.attempts}</b></span>
          <a class="text-link" href="#/dashboard">Flight record ${icon('arrowRight', 13)}</a>
        </div>
      </header>

      <main class="quiz-main">
        <section class="quiz-intro" id="quiz-intro">
          <div class="quiz-intro__copy">
            <p class="eyebrow">KNOWLEDGE CHECK / THREE LEVELS</p>
            <h1>Flight Academy</h1>
            <p class="page-lede">Test your command of planetary science, orbital mechanics and deep-space exploration. Each round draws eight questions from a thirty-question bank.</p>
            <div class="quiz-rules">
              <span>${icon('check', 14)} Immediate answer feedback</span>
              <span>${icon('check', 14)} Explanations after every question</span>
              <span>${icon('check', 14)} Progress saved on this device</span>
            </div>
          </div>

          <div class="difficulty-grid" aria-label="Select quiz difficulty">
            ${QUIZ_DIFFICULTIES.map((difficulty) => {
              const best = bestFor(history, difficulty.id);
              return `
                <button type="button" class="difficulty-card" data-start="${difficulty.id}" style="--quiz-accent:${difficulty.accent}">
                  <span class="difficulty-card__num">${difficulty.icon}</span>
                  <span class="difficulty-card__body">
                    <span class="difficulty-card__label">${difficulty.label}</span>
                    <span class="difficulty-card__desc">${difficulty.description}</span>
                    <span class="difficulty-card__meta">
                      <span>${QUESTIONS_BY_DIFFICULTY[difficulty.id].length} in pool</span>
                      <span class="meta-dot"></span>
                      <span>8 per round</span>
                      <span class="meta-dot"></span>
                      <span>${best >= 0 ? `Best ${best}%` : 'No attempt yet'}</span>
                    </span>
                  </span>
                  <span class="difficulty-card__action">${icon('arrowRight', 16)}</span>
                </button>
              `;
            }).join('')}
          </div>
        </section>

        <section class="quiz-session" id="quiz-session" hidden aria-label="Quiz in progress"></section>
        <section class="quiz-results" id="quiz-results" hidden aria-label="Quiz results"></section>
      </main>

      ${pageFooter()}
    </div>
  `;

  const introSection = root.querySelector('#quiz-intro');
  const sessionSection = root.querySelector('#quiz-session');
  const resultsSection = root.querySelector('#quiz-results');

  let difficulty = null;
  let round = [];
  let index = 0;
  let score = 0;
  let answered = false;
  let selectedOption = null;
  let answers = [];
  let saved = false;

  const showIntro = () => {
    sessionSection.hidden = true;
    resultsSection.hidden = true;
    introSection.hidden = false;
    sessionSection.innerHTML = '';
    resultsSection.innerHTML = '';
    difficulty = null;
    round = [];
    index = 0;
    score = 0;
    answered = false;
    selectedOption = null;
    answers = [];
    saved = false;
    introSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const startRound = (difficultyId) => {
    difficulty = QUIZ_DIFFICULTIES.find((item) => item.id === difficultyId) ?? QUIZ_DIFFICULTIES[0];
    round = prepareRound(difficulty.id);
    index = 0;
    score = 0;
    answered = false;
    selectedOption = null;
    answers = [];
    saved = false;
    introSection.hidden = true;
    resultsSection.hidden = true;
    sessionSection.hidden = false;
    renderQuestion();
  };

  const renderQuestion = () => {
    const question = round[index];
    answered = false;
    selectedOption = null;
    sessionSection.style.setProperty('--quiz-accent', difficulty.accent);
    sessionSection.innerHTML = `
      <div class="quiz-progress">
        <div class="quiz-progress__top">
          <span class="eyebrow">${difficulty.label.toUpperCase()} / QUESTION ${String(index + 1).padStart(2, '0')} OF ${String(round.length).padStart(2, '0')}</span>
          <button class="text-link quiz-exit" type="button" data-exit>${icon('x', 13)} Exit round</button>
        </div>
        <div class="quiz-progress__track"><span style="width:${((index + 0.001) / round.length) * 100}%"></span></div>
        <div class="quiz-progress__meta">
          <span>SCORE <b data-live-score>${String(score).padStart(2, '0')}</b> / ${String(round.length).padStart(2, '0')}</span>
          <span class="quiz-progress__difficulty">${icon('spark', 12)} ${difficulty.label.toUpperCase()}</span>
        </div>
      </div>

      <article class="quiz-card">
        <div class="quiz-card__index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</div>
        <h2>${question.question}</h2>
        <div class="quiz-options" role="group" aria-label="Answer options">
          ${question.options
            .map(
              (option, optionIndex) => `
                <button type="button" class="quiz-option" data-option="${optionIndex}">
                  <span class="quiz-option__letter">${letter(optionIndex)}</span>
                  <span class="quiz-option__text">${option.text}</span>
                  <span class="quiz-option__mark" aria-hidden="true"></span>
                </button>
              `,
            )
            .join('')}
        </div>
        <div class="quiz-feedback" id="quiz-feedback" role="status" aria-live="polite" hidden></div>
        <div class="quiz-card__footer">
          <span class="data-note">${icon('info', 12)} Answers are revealed only after you select one.</span>
          <button class="button button--primary" type="button" data-next disabled>
            ${icon('arrowRight', 16)} <span data-next-label>Next question</span>
          </button>
        </div>
      </article>
    `;

    const optionButtons = [...sessionSection.querySelectorAll('[data-option]')];
    optionButtons.forEach((button) => {
      button.addEventListener('click', () => answerQuestion(Number(button.dataset.option)));
    });
    sessionSection.querySelector('[data-next]').addEventListener('click', nextQuestion);
    sessionSection.querySelector('[data-exit]').addEventListener('click', exitRound);
    sessionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const answerQuestion = (optionIndex) => {
    if (answered) return;
    answered = true;
    selectedOption = optionIndex;
    const question = round[index];
    const option = question.options[optionIndex];
    const correctOption = question.options.find((item) => item.correct);
    if (option.correct) score += 1;
    answers.push({
      question: question.question,
      selected: option.text,
      correct: correctOption.text,
      isCorrect: option.correct,
      explanation: question.explanation,
    });

    const optionButtons = [...sessionSection.querySelectorAll('[data-option]')];
    optionButtons.forEach((button, idx) => {
      const current = question.options[idx];
      button.disabled = true;
      button.classList.toggle('is-correct', current.correct);
      button.classList.toggle('is-wrong', idx === optionIndex && !current.correct);
      if (idx !== optionIndex && !current.correct) button.classList.add('is-dimmed');
      const mark = button.querySelector('.quiz-option__mark');
      if (current.correct) mark.textContent = 'CORRECT';
      else if (idx === optionIndex) mark.textContent = 'YOUR CHOICE';
    });

    const feedback = sessionSection.querySelector('#quiz-feedback');
    feedback.hidden = false;
    feedback.className = `quiz-feedback ${option.correct ? 'is-correct' : 'is-wrong'}`;
    feedback.innerHTML = `
      <span class="quiz-feedback__icon">${icon(option.correct ? 'check' : 'x', 18)}</span>
      <div>
        <strong>${option.correct ? 'Correct.' : 'Not quite.'}</strong>
        <p>${option.correct ? '' : `The correct answer is <b>${correctOption.text}</b>. `}${question.explanation}</p>
      </div>
    `;
    feedback.tabIndex = -1;
    feedback.focus({ preventScroll: true });

    sessionSection.querySelector('[data-live-score]').textContent = String(score).padStart(2, '0');
    const nextButton = sessionSection.querySelector('[data-next]');
    nextButton.disabled = false;
    sessionSection.querySelector('[data-next-label]').textContent =
      index === round.length - 1 ? 'View results' : 'Next question';
    sessionSection.querySelector('.quiz-progress__track span').style.width = `${((index + 1) / round.length) * 100}%`;
  };

  const nextQuestion = () => {
    if (!answered) return;
    if (index >= round.length - 1) {
      finishRound();
      return;
    }
    index += 1;
    renderQuestion();
  };

  const finishRound = () => {
    if (saved) return;
    saved = true;
    const percent = Math.round((score / round.length) * 100);
    store.recordQuiz({ difficulty: difficulty.id, score, total: round.length });
    const snapshot = store.getState();
    const feedback = feedbackCopy(percent);
    const best = bestFor(snapshot.quiz.history, difficulty.id);
    sessionSection.hidden = true;
    resultsSection.hidden = false;
    resultsSection.style.setProperty('--quiz-accent', difficulty.accent);
    resultsSection.innerHTML = `
      <div class="quiz-result-card">
        <div class="quiz-result-hero">
          <div class="quiz-score-ring" style="--score:${percent};--quiz-accent:${difficulty.accent}">
            <div>
              <strong>${percent}<small>%</small></strong>
              <span>SCORE</span>
            </div>
          </div>
          <div class="quiz-result-copy">
            <p class="eyebrow">${difficulty.label.toUpperCase()} ROUND COMPLETE</p>
            <h2>${feedback.title}</h2>
            <p>${feedback.copy}</p>
            <div class="quiz-result-stats">
              <span><b>${score} / ${round.length}</b>Correct answers</span>
              <span><b>${best}%</b>Personal best</span>
              <span><b>${snapshot.quiz.attempts}</b>Total attempts</span>
            </div>
          </div>
        </div>

        <div class="quiz-review">
          <div class="quiz-review__head">
            <span class="eyebrow">ANSWER REVIEW</span>
            <span class="panel-head__count">${round.length} QUESTIONS</span>
          </div>
          ${answers
            .map(
              (answer, answerIndex) => `
                <div class="quiz-review__item ${answer.isCorrect ? 'is-correct' : 'is-wrong'}">
                  <span class="quiz-review__status">${icon(answer.isCorrect ? 'check' : 'x', 13)}</span>
                  <div class="quiz-review__body">
                    <span class="quiz-review__index">QUESTION ${String(answerIndex + 1).padStart(2, '0')}</span>
                    <h3>${answer.question}</h3>
                    <p class="quiz-review__your">Your answer: <b>${answer.selected}</b></p>
                    ${answer.isCorrect ? '' : `<p class="quiz-review__correct">Correct answer: <b>${answer.correct}</b></p>`}
                    <p class="quiz-review__explanation">${answer.explanation}</p>
                  </div>
                </div>
              `,
            )
            .join('')}
        </div>

        <div class="quiz-result-actions">
          <button class="button button--primary" type="button" data-play-again>${icon('reset', 16)} New ${difficulty.label} round</button>
          <button class="button button--ghost" type="button" data-change-level>Change difficulty</button>
          <a class="button button--ghost" href="#/dashboard">View flight record ${icon('arrowRight', 15)}</a>
        </div>
      </div>
    `;
    resultsSection.querySelector('[data-play-again]').addEventListener('click', () => startRound(difficulty.id));
    resultsSection.querySelector('[data-change-level]').addEventListener('click', showIntro);
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    ctx.toast(`${difficulty.label} round saved: ${score}/${round.length} correct.`, {
      type: percent >= 63 ? 'success' : 'info',
      title: 'Knowledge check complete',
    });
  };

  const exitRound = async () => {
    const hasProgress = answered || index > 0;
    if (hasProgress) {
      const confirmed = await ctx.confirm({
        eyebrow: 'END ROUND',
        title: 'Leave this round?',
        message: 'Your answers in this round will not be scored or saved to your flight record.',
        confirmLabel: 'Exit round',
        cancelLabel: 'Keep answering',
        danger: true,
      });
      if (!confirmed) return;
    }
    showIntro();
  };

  root.querySelectorAll('[data-start]').forEach((button) => {
    button.addEventListener('click', () => startRound(button.dataset.start));
  });

  return () => {};
}
