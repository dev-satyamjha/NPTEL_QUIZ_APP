const urlParams = new URLSearchParams(window.location.search);
const quizMode = urlParams.get("m");
const courseName = urlParams.get("c");

const questionWrapper = document.getElementById("question-wrapper");
const resultsBox = document.getElementById("results-box");
const quizTitle = document.getElementById("quiz-title");
const timerDisplay = document.getElementById("timer-display");
const themeToggleBtn = document.getElementById("theme-btn");
const layoutWrapper = document.getElementById("quiz-layout-wrapper");

let currentQuestionList = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let score = 0;
let timerInterval;
let startTime = Date.now();

window.goBackToDashboard = function () {
  if (courseName) {
    window.location.href = `dashboard.html?c=${encodeURIComponent(courseName)}`;
  } else {
    window.location.href = "index.html";
  }
};

if (themeToggleBtn) {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    themeToggleBtn.innerText = "☀️ Light Mode";
  }
  themeToggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDarkMode = document.body.classList.contains("dark-mode");
    themeToggleBtn.innerText = isDarkMode ? "☀️ Light Mode" : "🌑 Dark Mode";
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  });
}

function prepareAndShuffleQuestions(sourceQuestions) {
  if (!sourceQuestions || sourceQuestions.length === 0) return [];

  return sourceQuestions.map((question) => {
    let clonedQuestion = { ...question, options: [...question.options] };
    let correctAnswerText = clonedQuestion.options[clonedQuestion.answer];

    for (let i = clonedQuestion.options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [clonedQuestion.options[i], clonedQuestion.options[j]] = [
        clonedQuestion.options[j],
        clonedQuestion.options[i],
      ];
    }

    clonedQuestion.answer = clonedQuestion.options.indexOf(correctAnswerText);
    return clonedQuestion;
  });
}

function startQuiz() {
  if (!quizMode || !courseName || !quizData[courseName]) {
    questionWrapper.innerHTML =
      "<h2 style='text-align:center;'>Error: Course or Quiz Mode not found.</h2>";
    return;
  }

  let modeText =
    quizMode === "m" ? "Mock Exam" : quizMode === "a" ? "All Weeks" : quizMode;
  quizTitle.innerText = `${courseName} - ${modeText}`;

  let rawQuestions = [];

  if (quizMode === "m" || quizMode === "a") {
    let courseData = quizData[courseName];
    for (let week in courseData) {
      rawQuestions = rawQuestions.concat(courseData[week]);
    }

    if (quizMode === "m") {
      rawQuestions.sort(() => Math.random() - 0.5);
      rawQuestions = rawQuestions.slice(0, 50);
    }
  } else {
    rawQuestions = quizData[courseName][quizMode] || [];
  }

  currentQuestionList = prepareAndShuffleQuestions(rawQuestions);
  userAnswers = new Array(currentQuestionList.length).fill(-1);

  if (currentQuestionList.length === 0) {
    questionWrapper.innerHTML =
      "<br><h2 style='text-align:center; color:#6c757d;'>No questions available for this section yet!</h2>";
    return;
  }

  if (quizMode === "m") {
    document.getElementById("palette-area-wrapper").style.display = "block";
    document.getElementById("navigation-controls").style.display = "flex";
    timerDisplay.style.display = "block";

    timerInterval = setInterval(updateTimer, 1000);
    buildPalette();
    renderMockQuestion();
  } else {
    renderAllQuestions();
  }
}

function updateTimer() {
  let elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
  let timeLeft = 10800 - elapsedSeconds;
  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    submitQuiz();
    return;
  }
  let hours = Math.floor(timeLeft / 3600);
  let minutes = Math.floor((timeLeft % 3600) / 60);
  let seconds = timeLeft % 60;
  timerDisplay.innerText = `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function buildPalette() {
  const paletteGrid = document.getElementById("palette-grid-container");
  paletteGrid.innerHTML = "";
  currentQuestionList.forEach((_, index) => {
    let paletteBtn = document.createElement("button");
    paletteBtn.className = "palette-btn";
    paletteBtn.id = "palette-btn-" + index;
    paletteBtn.innerText = index + 1;
    paletteBtn.onclick = () => {
      currentQuestionIndex = index;
      renderMockQuestion();
    };
    paletteGrid.appendChild(paletteBtn);
  });
}

function updatePalette() {
  currentQuestionList.forEach((_, index) => {
    let paletteBtn = document.getElementById("palette-btn-" + index);
    if (!paletteBtn) return;
    paletteBtn.className = "palette-btn";
    if (userAnswers[index] !== -1) paletteBtn.classList.add("attempted");
    if (index === currentQuestionIndex) paletteBtn.classList.add("current");
  });
}

function navigateNext() {
  if (currentQuestionIndex < currentQuestionList.length - 1) {
    currentQuestionIndex++;
    renderMockQuestion();
  }
}

function navigatePrevious() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderMockQuestion();
  }
}

function renderMockQuestion() {
  questionWrapper.innerHTML = "";
  let questionData = currentQuestionList[currentQuestionIndex];

  let questionBox = document.createElement("div");
  questionBox.className = "question-box";
  questionBox.style.border = "none";
  questionBox.style.padding = "0";
  questionBox.innerHTML = `<p class="question-text">Q${currentQuestionIndex + 1}. ${questionData.question}</p>`;

  let optionsContainer = document.createElement("div");
  optionsContainer.className = "options-container";

  questionData.options.forEach((optionText, optionIndex) => {
    let optionBtn = document.createElement("button");
    optionBtn.className = "option-btn";
    if (userAnswers[currentQuestionIndex] === optionIndex)
      optionBtn.classList.add("selected");
    optionBtn.innerText = optionText;
    optionBtn.onclick = () => {
      Array.from(optionsContainer.children).forEach((child) =>
        child.classList.remove("selected"),
      );
      optionBtn.classList.add("selected");
      userAnswers[currentQuestionIndex] = optionIndex;
      updatePalette();
    };
    optionsContainer.appendChild(optionBtn);
  });

  questionBox.appendChild(optionsContainer);
  questionWrapper.appendChild(questionBox);

  document.getElementById("prev-btn").style.visibility =
    currentQuestionIndex > 0 ? "visible" : "hidden";
  document.getElementById("next-btn").style.visibility =
    currentQuestionIndex < currentQuestionList.length - 1
      ? "visible"
      : "hidden";
  updatePalette();
}

function renderAllQuestions() {
  questionWrapper.innerHTML = "";
  currentQuestionList.forEach((questionData, index) => {
    let questionBox = document.createElement("div");
    questionBox.className = "question-box";
    questionBox.innerHTML = `<p class="question-text">Q${index + 1}. ${questionData.question}</p>`;

    let optionsContainer = document.createElement("div");
    optionsContainer.className = "options-container";

    questionData.options.forEach((optionText, optionIndex) => {
      let optionBtn = document.createElement("button");
      optionBtn.className = "option-btn";
      if (userAnswers[index] === optionIndex)
        optionBtn.classList.add("selected");
      optionBtn.innerText = optionText;
      optionBtn.onclick = () => {
        if (document.getElementById("submit-all-btn").style.display === "none")
          return;
        Array.from(optionsContainer.children).forEach((child) =>
          child.classList.remove("selected"),
        );
        optionBtn.classList.add("selected");
        userAnswers[index] = optionIndex;
      };
      optionsContainer.appendChild(optionBtn);
    });
    questionBox.appendChild(optionsContainer);
    questionWrapper.appendChild(questionBox);
  });
  document.getElementById("submit-all-btn").style.display = "block";
}

function submitQuiz() {
  clearInterval(timerInterval);
  score = 0;
  currentQuestionList.forEach((questionData, index) => {
    if (userAnswers[index] === questionData.answer) score++;
  });

  let timeTakenSeconds = Math.floor((Date.now() - startTime) / 1000);
  let hours = Math.floor(timeTakenSeconds / 3600);
  let minutes = Math.floor((timeTakenSeconds % 3600) / 60);
  let seconds = timeTakenSeconds % 60;
  let accuracy = ((score / currentQuestionList.length) * 100).toFixed(2);

  document.getElementById("quiz-layout-wrapper").style.display = "none";
  if (timerDisplay) timerDisplay.style.display = "none";

  resultsBox.style.display = "block";
  resultsBox.innerHTML = `<h2 style="font-size:2em; margin-bottom:10px;">Score: ${score} / ${currentQuestionList.length}</h2>`;

  if (quizMode === "m") {
    resultsBox.innerHTML += `<p style="text-align:center; font-weight:bold; color:#007bff; font-size:1.2em;">Time Taken: ${hours}h ${minutes}m ${seconds}s <br> Accuracy: ${accuracy}%</p><hr style="border:1px solid var(--border-color); margin:20px 0;">`;
  }

  currentQuestionList.forEach((questionData, index) => {
    let resultDiv = document.createElement("div");
    let colorClass =
      userAnswers[index] === questionData.answer ? "correct" : "wrong";
    resultDiv.innerHTML = `<p class="${colorClass}"><strong>Q${index + 1}. ${questionData.question}</strong><br><br>Your answer: ${questionData.options[userAnswers[index]] || "Skipped"}<br>Correct: ${questionData.options[questionData.answer]}</p>`;
    resultsBox.appendChild(resultDiv);
  });
}

startQuiz();
