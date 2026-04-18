const urlParams = new URLSearchParams(window.location.search);
const quizMode = urlParams.get("m");
const questionWrapper = document.getElementById("question-wrapper");
const resultsBox = document.getElementById("results-box");
const quizTitle = document.getElementById("quiz-title");
const timerDisplay = document.getElementById("timer-display");
const themeToggleBtn = document.getElementById("theme-btn");

let currentQuestionList = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let score = 0;
let timerInterval;
let startTime = Date.now();

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

function startQuiz() {
  if (!quizMode) return;
  quizTitle.innerText =
    quizMode === "m" ? "Mock Exam" : quizMode === "a" ? "All Weeks" : quizMode;

  if (quizMode === "m") {
    let allQuestions = [];
    for (let week in quizData) {
      allQuestions = allQuestions.concat(quizData[week]);
    }
    allQuestions.sort(() => Math.random() - 0.5);
    currentQuestionList = allQuestions.slice(0, 50);

    document.getElementById("palette-area-wrapper").style.display = "block";
    document.getElementById("navigation-controls").style.display = "flex";
    timerDisplay.style.display = "block";

    timerInterval = setInterval(updateTimer, 1000);
    userAnswers = new Array(currentQuestionList.length).fill(-1);
    buildPalette();
    renderMockQuestion();
  } else {
    if (quizMode === "a") {
      for (let week in quizData) {
        currentQuestionList = currentQuestionList.concat(quizData[week]);
      }
    } else {
      currentQuestionList = quizData[quizMode];
    }
    userAnswers = new Array(currentQuestionList.length).fill(-1);
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
  timerDisplay.style.display = "none";

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
