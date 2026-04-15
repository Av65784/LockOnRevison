import {
  signInWithGoogle,
  watchAuthState,
  createSubject,
  listSubjects,
  listUnits,
  updateUserPlan,
  saveWeakTopics,
  getUserProfile,
  updateUserLearningMetrics
} from "./firebase.js";

const API_KEY = "YOUR_API_KEY";

const subjectList = document.getElementById("subjectList");
const loginButton = document.getElementById("googleLoginBtn");
const authStatus = document.getElementById("authStatus");
const subjectForm = document.getElementById("subjectForm");
const subjectNameInput = document.getElementById("subjectNameInput");
const subjectHint = document.getElementById("subjectHint");
const unitList = document.getElementById("unitList");
const unitHint = document.getElementById("unitHint");
const unitsTitle = document.getElementById("unitsTitle");
const notesForm = document.getElementById("notesForm");
const notesFileInput = document.getElementById("notesFileInput");
const notesHint = document.getElementById("notesHint");
const generatedUnits = document.getElementById("generatedUnits");
const lessonContainer = document.getElementById("lessonContainer");
const quizContainer = document.getElementById("quizContainer");
const submitQuizBtn = document.getElementById("submitQuizBtn");
const quizResult = document.getElementById("quizResult");
const difficultyBadge = document.getElementById("difficultyBadge");
const weakTopicsList = document.getElementById("weakTopicsList");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const razorpayBtn = document.getElementById("razorpayBtn");
const planStatus = document.getElementById("planStatus");
const energyChipValue = document.getElementById("energyChipValue");
const streakChipValue = document.getElementById("streakChipValue");
const usageChipValue = document.getElementById("usageChipValue");
const energyCardValue = document.getElementById("energyCardValue");
const streakCardValue = document.getElementById("streakCardValue");
const usageCardValue = document.getElementById("usageCardValue");
const sidebarLinks = document.querySelectorAll(".sidebar-link");
const pageSections = {
  dashboard: document.getElementById("dashboard-section"),
  revision: document.getElementById("revision-section"),
  forge: document.getElementById("forge-section"),
  pro: document.getElementById("pro-section")
};
const wrongQuestionList = document.getElementById("wrongQuestionList");
const submitRevisionBtn = document.getElementById("submitRevisionBtn");
const revisionHint = document.getElementById("revisionHint");
const todayGoalText = document.getElementById("todayGoalText");
const focusTopicText = document.getElementById("focusTopicText");

const appState = {
  currentUser: null,
  subjects: [],
  selectedSubjectId: null,
  generatedCourse: null,
  weakTopics: {},
  adaptiveDifficulty: "Beginner",
  plan: "free",
  energy: 0,
  streak: 0,
  dailyUsage: {},
  lastActiveDate: "",
  sessionStartMs: null,
  lastUsageSyncMs: null,
  usageTimerId: null,
  wrongQuestions: []
};

function getTodayDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDateKeyFromOffset(dayOffset) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayUsageMinutes() {
  const today = getTodayDateKey();
  const usageValue = appState.dailyUsage[today] || 0;
  return Math.floor(usageValue);
}

function renderDashboardStats() {
  const energyText = `${Math.floor(appState.energy)} XP`;
  const streakText = `${Math.floor(appState.streak)} days`;
  const usageText = `${getTodayUsageMinutes()} min`;

  if (energyChipValue) energyChipValue.textContent = energyText;
  if (streakChipValue) streakChipValue.textContent = streakText;
  if (usageChipValue) usageChipValue.textContent = usageText;
  if (energyCardValue) energyCardValue.textContent = energyText;
  if (streakCardValue) streakCardValue.textContent = `${Math.floor(appState.streak)} Days`;
  if (usageCardValue) usageCardValue.textContent = `${getTodayUsageMinutes()} Min`;
  updateGuidanceCards();
}

function updateGuidanceCards() {
  if (todayGoalText) {
    const usage = getTodayUsageMinutes();
    if (usage < 10) {
      todayGoalText.textContent = "Reach 10 minutes and complete one quiz";
    } else if (usage < 20) {
      todayGoalText.textContent = "Complete one revision set to lock learning";
    } else {
      todayGoalText.textContent = "Great pace. Add one more unit for momentum";
    }
  }

  if (focusTopicText) {
    const topicEntries = Object.entries(appState.weakTopics).sort(function (a, b) {
      return b[1] - a[1];
    });
    focusTopicText.textContent = topicEntries.length
      ? `${topicEntries[0][0]} (${topicEntries[0][1]} weak hits)`
      : "No weak topic yet";
  }
}

function showPage(pageName) {
  const targetPage = pageName in pageSections ? pageName : "dashboard";
  Object.keys(pageSections).forEach(function (key) {
    const section = pageSections[key];
    if (!section) return;
    if (key === targetPage) {
      section.classList.remove("hidden");
      section.classList.add("page-enter");
      window.requestAnimationFrame(function () {
        section.classList.remove("page-enter");
      });
    } else {
      section.classList.add("hidden");
      section.classList.remove("page-enter");
    }
  });

  sidebarLinks.forEach(function (button) {
    const isActive = button.getAttribute("data-page") === targetPage;
    button.classList.toggle("active", isActive);
  });
}

window.showPage = showPage;

function renderSubjects(items) {
  if (!subjectList) return;

  if (!items.length) {
    subjectList.innerHTML = "";
    if (subjectHint) {
      subjectHint.textContent = "No subjects yet. Create your first subject.";
    }
    return;
  }

  subjectList.innerHTML = items
    .map(function (item) {
      const isActive = appState.selectedSubjectId === item.id;
      return `
        <button class="subject-select ${isActive ? "active" : ""}" data-subject-id="${item.id}" type="button">
          ${item.name}
        </button>
      `;
    })
    .join("");

  if (subjectHint) {
    subjectHint.textContent = "Select a subject to view units.";
  }
}

function getComputedUnlockState(units, unit, index) {
  if (unit.unlocked) return true;
  if (index === 0) return true;
  const previous = units[index - 1];
  return Boolean(previous && previous.isCompleted);
}

function renderUnits(subjectName, units) {
  if (!unitList || !unitsTitle || !unitHint) return;
  unitsTitle.textContent = subjectName ? `${subjectName} Units` : "Units";

  if (!units.length) {
    unitList.innerHTML = "";
    unitHint.textContent = "No units found for this subject.";
    return;
  }

  unitList.innerHTML = units
    .map(function (unit, index) {
      const isUnlocked = getComputedUnlockState(units, unit, index);
      const stateClass = isUnlocked ? "state-unlocked" : "state-locked";
      const stateLabel = isUnlocked ? "Unlocked" : "Locked";
      const subunits = Array.isArray(unit.subunits) ? unit.subunits : [];
      const subunitHtml = subunits
        .map(function (subunit) {
          return `<li>${subunit.title}</li>`;
        })
        .join("");

      return `
        <article class="unit-item">
          <div class="unit-header">
            <strong>${unit.title}</strong>
            <span class="state-pill ${stateClass}">${stateLabel}</span>
          </div>
          <ul class="subunit-list">${subunitHtml}</ul>
        </article>
      `;
    })
    .join("");
  unitHint.textContent = "Unit lock state updates based on completion order.";
}

function setPlanStatus(plan) {
  appState.plan = plan || "free";
  if (planStatus) {
    planStatus.textContent = `Current plan: ${appState.plan}`;
  }
}

async function persistLearningStats(fields) {
  if (!appState.currentUser) return;
  try {
    await updateUserLearningMetrics(appState.currentUser.uid, fields);
  } catch (error) {
    console.error(error);
  }
}

async function applyDailyStreakPolicy() {
  const today = getTodayDateKey();
  const yesterday = toDateKeyFromOffset(-1);
  const previousDate = appState.lastActiveDate || "";

  if (previousDate === today) {
    return;
  }

  if (previousDate === yesterday) {
    appState.streak += 1;
  } else {
    appState.streak = 1;
  }

  appState.lastActiveDate = today;
  renderDashboardStats();
  await persistLearningStats({
    streak: appState.streak,
    lastActiveDate: appState.lastActiveDate
  });
}

function stopUsageTracking() {
  if (appState.usageTimerId) {
    clearInterval(appState.usageTimerId);
    appState.usageTimerId = null;
  }
  appState.sessionStartMs = null;
  appState.lastUsageSyncMs = null;
}

async function flushUsageTime(forceFlush) {
  if (!appState.currentUser || !appState.lastUsageSyncMs) return;
  const now = Date.now();
  const elapsedMs = now - appState.lastUsageSyncMs;
  const minElapsedForFlush = forceFlush ? 1000 : 60000;
  if (elapsedMs < minElapsedForFlush) return;

  const deltaMinutes = elapsedMs / 60000;
  const today = getTodayDateKey();
  const current = Number(appState.dailyUsage[today] || 0);
  appState.dailyUsage[today] = Number((current + deltaMinutes).toFixed(2));
  appState.lastUsageSyncMs = now;
  renderDashboardStats();

  await persistLearningStats({
    dailyUsage: appState.dailyUsage,
    lastActiveDate: today
  });
}

function startUsageTracking() {
  stopUsageTracking();
  const now = Date.now();
  appState.sessionStartMs = now;
  appState.lastUsageSyncMs = now;
  appState.usageTimerId = window.setInterval(function () {
    flushUsageTime(false);
  }, 60000);
}

async function awardEnergy(points) {
  if (!appState.currentUser) return;
  appState.energy += points;
  renderDashboardStats();
  await persistLearningStats({ energy: appState.energy });
}

function renderWeakTopics() {
  if (!weakTopicsList) return;
  const topicEntries = Object.entries(appState.weakTopics);
  if (!topicEntries.length) {
    weakTopicsList.innerHTML = "<span class='muted'>No weak topics yet.</span>";
    return;
  }
  weakTopicsList.innerHTML = topicEntries
    .sort(function (a, b) {
      return b[1] - a[1];
    })
    .map(function (entry) {
      return `<span class="weak-topic-pill">${entry[0]} (${entry[1]})</span>`;
    })
    .join("");
  updateGuidanceCards();
}

function renderWrongQuestions() {
  if (!wrongQuestionList || !revisionHint) return;
  if (!appState.wrongQuestions.length) {
    wrongQuestionList.innerHTML = "";
    revisionHint.textContent = "No wrong questions yet.";
    return;
  }

  wrongQuestionList.innerHTML = appState.wrongQuestions
    .map(function (item, index) {
      if (item.type === "mcq") {
        return `
          <article class="quiz-item">
            <p><strong>RQ${index + 1} (MCQ):</strong> ${item.question}</p>
            ${item.options
              .map(function (option) {
                return `<label><input type="radio" name="rq_${index}" value="${option}"> ${option}</label><br/>`;
              })
              .join("")}
          </article>
        `;
      }
      return `
        <article class="quiz-item">
          <p><strong>RQ${index + 1} (${item.type === "fill_blank" ? "Fill in blank" : "Short answer"}):</strong> ${item.question}</p>
          <input class="subject-input" type="text" name="rq_${index}" />
        </article>
      `;
    })
    .join("");
  revisionHint.textContent = "Retry the questions you previously missed.";
}

async function evaluateRevisionQuiz() {
  if (!wrongQuestionList || !appState.wrongQuestions.length) return;
  let resolvedCount = 0;

  appState.wrongQuestions = appState.wrongQuestions.filter(function (item, index) {
    const selector = `[name="rq_${index}"]`;
    if (item.type === "mcq") {
      const checked = wrongQuestionList.querySelector(`${selector}:checked`);
      const isCorrect = checked && checked.value === item.answer;
      if (isCorrect) {
        resolvedCount += 1;
        return false;
      }
      return true;
    }

    const input = wrongQuestionList.querySelector(selector);
    const value = input ? input.value.trim().toLowerCase() : "";
    const isCorrect = value.includes(item.answer.toLowerCase());
    if (isCorrect) {
      resolvedCount += 1;
      return false;
    }
    return true;
  });

  renderWrongQuestions();
  if (revisionHint) {
    revisionHint.textContent = resolvedCount
      ? `Great! You corrected ${resolvedCount} question(s).`
      : "No correct revisions yet. Try again.";
  }

  if (resolvedCount > 0) {
    await awardEnergy(resolvedCount * 5);
  }

  if (appState.currentUser) {
    await persistLearningStats({ wrongQuestions: appState.wrongQuestions });
  }
}

function updateAdaptiveDifficulty() {
  const totalWeakHits = Object.values(appState.weakTopics).reduce(function (sum, count) {
    return sum + count;
  }, 0);

  if (totalWeakHits >= 6) appState.adaptiveDifficulty = "Beginner";
  else if (totalWeakHits >= 3) appState.adaptiveDifficulty = "Intermediate";
  else appState.adaptiveDifficulty = "Advanced";

  if (difficultyBadge) {
    difficultyBadge.textContent = appState.adaptiveDifficulty;
  }
}

function createHintedText(text) {
  const hintMap = {
    algorithm: "A step-by-step procedure for solving a problem.",
    variable: "A named storage location in code.",
    function: "Reusable block of logic that can be invoked.",
    array: "Ordered list structure used to store values."
  };

  let output = text;
  Object.keys(hintMap).forEach(function (keyword) {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    output = output.replace(
      regex,
      `<span class="hint-keyword" title="${hintMap[keyword]}">$&</span>`
    );
  });
  return output;
}

function renderGeneratedUnits(units) {
  if (!generatedUnits) return;
  generatedUnits.innerHTML = units
    .map(function (unit, index) {
      return `
        <article class="unit-item">
          <div class="unit-header">
            <strong>Unit ${index + 1}: ${unit.title}</strong>
            <span class="state-pill state-unlocked">AI</span>
          </div>
          <ul class="subunit-list">
            ${unit.lessons
              .map(function (lesson) {
                return `<li>${lesson.title}</li>`;
              })
              .join("")}
          </ul>
        </article>
      `;
    })
    .join("");
}

function renderLessons(lessons) {
  if (!lessonContainer) return;
  lessonContainer.innerHTML = lessons
    .map(function (lesson) {
      return `
        <article class="lesson-item">
          <h4>${lesson.title}</h4>
          <p>${createHintedText(lesson.content)}</p>
        </article>
      `;
    })
    .join("");
}

function renderQuiz(quiz) {
  if (!quizContainer) return;
  quizContainer.innerHTML = quiz
    .map(function (item, index) {
      if (item.type === "mcq") {
        return `
          <article class="quiz-item" data-topic="${item.topic}">
            <p><strong>Q${index + 1} (MCQ):</strong> ${item.question}</p>
            ${item.options
              .map(function (option) {
                return `<label><input type="radio" name="q_${index}" value="${option}"> ${option}</label><br/>`;
              })
              .join("")}
          </article>
        `;
      }
      return `
        <article class="quiz-item" data-topic="${item.topic}">
          <p><strong>Q${index + 1} (${item.type === "fill_blank" ? "Fill in blank" : "Short answer"}):</strong> ${item.question}</p>
          <input class="subject-input" type="text" name="q_${index}" />
        </article>
      `;
    })
    .join("");
}

function flattenLessons(course) {
  return course.units.reduce(function (all, unit) {
    return all.concat(unit.lessons);
  }, []);
}

function generateMockCourseFromNotes(fileName) {
  const difficulty = appState.adaptiveDifficulty;
  const baseUnits = [
    {
      title: `${fileName} Core Concepts`,
      lessons: [
        {
          title: "Lesson 1: Variables and Functions",
          content:
            "A variable stores data while a function applies reusable logic."
        },
        {
          title: "Lesson 2: Arrays and Algorithm Basics",
          content:
            "An array helps organize values and an algorithm defines execution steps."
        }
      ]
    },
    {
      title: `${fileName} Applied Practice`,
      lessons: [
        {
          title: "Lesson 3: Problem Breakdown",
          content:
            "Use a function per task and test each algorithm with sample inputs."
        },
        {
          title: "Lesson 4: Review and Reflection",
          content:
            "Track weak spots, revise each variable usage, and improve correctness."
        }
      ]
    }
  ];

  const quiz = [
    {
      type: "mcq",
      topic: "Variables",
      question: "What is a variable primarily used for?",
      options: ["Data storage", "Rendering CSS", "Deploying code", "Payments"],
      answer: "Data storage"
    },
    {
      type: "fill_blank",
      topic: "Functions",
      question: "A ____ is a reusable block of logic in programming.",
      answer: "function"
    },
    {
      type: "short_answer",
      topic: "Algorithms",
      question: "Why is an algorithm useful when solving a complex task?",
      answer: "step"
    }
  ];

  if (difficulty === "Advanced") {
    quiz.push({
      type: "short_answer",
      topic: "Optimization",
      question: "How would you optimize an algorithm with repeated operations?",
      answer: "cache"
    });
  }

  return { units: baseUnits, quiz: quiz };
}

async function evaluateQuizAnswers() {
  if (!appState.generatedCourse || !quizContainer) return;
  let score = 0;
  const weakTopicsDelta = {};

  const newWrongQuestions = [];

  appState.generatedCourse.quiz.forEach(function (item, index) {
    const selector = `[name="q_${index}"]`;
    let value = "";
    if (item.type === "mcq") {
      const checked = quizContainer.querySelector(`${selector}:checked`);
      value = checked ? checked.value : "";
      if (value === item.answer) {
        score += 1;
      } else {
        weakTopicsDelta[item.topic] = (weakTopicsDelta[item.topic] || 0) + 1;
        newWrongQuestions.push(item);
      }
      return;
    }

    const input = quizContainer.querySelector(selector);
    value = input ? input.value.trim().toLowerCase() : "";
    if (value.includes(item.answer.toLowerCase())) {
      score += 1;
    } else {
      weakTopicsDelta[item.topic] = (weakTopicsDelta[item.topic] || 0) + 1;
      newWrongQuestions.push(item);
    }
  });

  newWrongQuestions.forEach(function (question) {
    const exists = appState.wrongQuestions.some(function (existing) {
      return existing.question === question.question && existing.type === question.type;
    });
    if (!exists) {
      appState.wrongQuestions.push(question);
    }
  });

  Object.keys(weakTopicsDelta).forEach(function (topic) {
    appState.weakTopics[topic] = (appState.weakTopics[topic] || 0) + weakTopicsDelta[topic];
  });

  renderWeakTopics();
  renderWrongQuestions();
  updateAdaptiveDifficulty();

  if (quizResult) {
    quizResult.textContent = `Score: ${score}/${appState.generatedCourse.quiz.length}`;
  }

  if (appState.currentUser) {
    saveWeakTopics(appState.currentUser.uid, appState.weakTopics).catch(console.error);
    const xpFromCorrectAnswers = score * 10;
    const completionBonusXp = 5;
    await awardEnergy(xpFromCorrectAnswers + completionBonusXp);
    await persistLearningStats({ wrongQuestions: appState.wrongQuestions });
  }
}

function appendChatMessage(role, text) {
  if (!chatMessages) return;
  const className = role === "user" ? "chat-user" : "chat-ai";
  const div = document.createElement("div");
  div.className = `chat-bubble ${className}`;
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function buildAiResponse(input) {
  const normalized = input.toLowerCase();
  if (normalized.includes("weak")) {
    const topics = Object.keys(appState.weakTopics);
    return topics.length
      ? `Focus on: ${topics.join(", ")}. I adjusted your difficulty to ${appState.adaptiveDifficulty}.`
      : "No weak topics yet. Complete a quiz and I will personalize your roadmap.";
  }
  if (normalized.includes("quiz")) {
    return "Use the generated quiz section and submit answers. I will track weak areas automatically.";
  }
  return `I analyzed your request using API key placeholder (${API_KEY}). Next step: revise lesson 1, then reattempt the quiz.`;
}

async function handleNotesGenerate(event) {
  event.preventDefault();
  if (!notesFileInput || !notesHint) return;
  const file = notesFileInput.files && notesFileInput.files[0];
  if (!file) {
    notesHint.textContent = "Please select a notes file.";
    return;
  }

  const minSize = 10 * 1024 * 1024;
  const maxSize = 20 * 1024 * 1024;
  if (file.size < minSize) {
    notesHint.textContent = "File too small. Upload at least 10MB notes for this mode.";
    return;
  }
  if (file.size > maxSize) {
    notesHint.textContent = "File too large. Please upload up to 20MB.";
    return;
  }

  notesHint.textContent = "Generating course using AI placeholder flow...";
  const generated = generateMockCourseFromNotes(file.name.replace(/\.[^.]+$/, ""));
  appState.generatedCourse = generated;
  renderGeneratedUnits(generated.units);
  renderLessons(flattenLessons(generated));
  renderQuiz(generated.quiz);
  notesHint.textContent = "Generation complete. Review lessons and attempt quiz.";
}

async function handleRazorpayUpgrade() {
  if (!appState.currentUser) {
    if (planStatus) planStatus.textContent = "Sign in first to upgrade.";
    return;
  }

  const razorpay = window.Razorpay;
  if (typeof razorpay !== "function") {
    if (planStatus) planStatus.textContent = "Razorpay SDK not loaded.";
    return;
  }

  const options = {
    key: "YOUR_RAZORPAY_KEY_ID",
    amount: 2000,
    currency: "INR",
    name: "LockOn Learn Pro",
    description: "Pro Plan - ₹20/month",
    handler: async function () {
      try {
        await updateUserPlan(appState.currentUser.uid, "pro");
        setPlanStatus("pro");
      } catch (error) {
        console.error(error);
      }
    },
    prefill: {
      name: appState.currentUser.displayName || "Learner",
      email: appState.currentUser.email || ""
    },
    theme: { color: "#58cc02" }
  };

  const instance = new razorpay(options);
  instance.open();
}

function clearUnits(message) {
  if (!unitList || !unitHint || !unitsTitle) return;
  unitList.innerHTML = "";
  unitsTitle.textContent = "Units";
  unitHint.textContent = message;
}

function setSubjectFormState(disabled) {
  if (!subjectNameInput) return;
  subjectNameInput.disabled = disabled;
  if (subjectForm) {
    const submitButton = subjectForm.querySelector("button[type='submit']");
    if (submitButton) {
      submitButton.disabled = disabled;
    }
  }
}

async function refreshSubjects() {
  if (!appState.currentUser) return;
  appState.subjects = await listSubjects(appState.currentUser.uid);
  if (
    appState.selectedSubjectId &&
    !appState.subjects.some(function (item) {
      return item.id === appState.selectedSubjectId;
    })
  ) {
    appState.selectedSubjectId = null;
  }
  renderSubjects(appState.subjects);
}

async function openSubject(subjectId) {
  if (!appState.currentUser) return;
  appState.selectedSubjectId = subjectId;
  renderSubjects(appState.subjects);
  const selectedSubject = appState.subjects.find(function (item) {
    return item.id === subjectId;
  });
  const units = await listUnits(appState.currentUser.uid, subjectId);
  renderUnits(selectedSubject ? selectedSubject.name : "Units", units);
}

function setSignedOutView() {
  flushUsageTime(true).catch(console.error);
  stopUsageTracking();
  appState.currentUser = null;
  appState.subjects = [];
  appState.selectedSubjectId = null;
  appState.weakTopics = {};
  appState.generatedCourse = null;
  appState.energy = 0;
  appState.streak = 0;
  appState.dailyUsage = {};
  appState.lastActiveDate = "";
  appState.wrongQuestions = [];
  if (authStatus) authStatus.textContent = "Not signed in";
  if (loginButton) {
    loginButton.disabled = false;
    loginButton.textContent = "Login with Google";
  }
  renderSubjects([]);
  clearUnits("Select a subject to view units.");
  setSubjectFormState(true);
  if (subjectHint) {
    subjectHint.textContent = "Sign in to create and manage subjects.";
  }
  setPlanStatus("free");
  renderWeakTopics();
  renderWrongQuestions();
  updateAdaptiveDifficulty();
  renderDashboardStats();
  updateGuidanceCards();
}

async function setSignedInView(user) {
  appState.currentUser = user;
  const profile = await getUserProfile(user.uid);
  if (profile && profile.weakTopics) {
    appState.weakTopics = profile.weakTopics;
  }
  appState.wrongQuestions = Array.isArray(profile && profile.wrongQuestions)
    ? profile.wrongQuestions
    : [];
  appState.energy = Number((profile && profile.energy) || 0);
  appState.streak = Number((profile && profile.streak) || 0);
  appState.dailyUsage = (profile && profile.dailyUsage) || {};
  appState.lastActiveDate = (profile && profile.lastActiveDate) || "";
  if (authStatus) {
    authStatus.textContent = `Signed in as ${user.displayName || user.email}`;
  }
  if (loginButton) {
    loginButton.disabled = true;
    loginButton.textContent = "Signed In";
  }
  setSubjectFormState(false);
  await refreshSubjects();
  if (!appState.selectedSubjectId) {
    clearUnits("Select a subject to view units.");
  }
  setPlanStatus(profile && profile.plan ? profile.plan : "free");
  renderWeakTopics();
  renderWrongQuestions();
  updateAdaptiveDifficulty();
  await applyDailyStreakPolicy();
  startUsageTracking();
  renderDashboardStats();
  updateGuidanceCards();
}

async function handleGoogleLogin() {
  if (!loginButton || !authStatus) return;
  loginButton.disabled = true;
  loginButton.textContent = "Signing in...";

  try {
    await signInWithGoogle();
  } catch (error) {
    authStatus.textContent = "Login failed. Check Firebase config.";
    loginButton.disabled = false;
    loginButton.textContent = "Login with Google";
    console.error(error);
  }
}

async function handleCreateSubject(event) {
  event.preventDefault();
  if (!appState.currentUser || !subjectNameInput) return;

  const name = subjectNameInput.value.trim();
  if (!name) return;

  setSubjectFormState(true);
  try {
    const subjectId = await createSubject(appState.currentUser.uid, name);
    subjectNameInput.value = "";
    await refreshSubjects();
    await openSubject(subjectId);
  } catch (error) {
    if (subjectHint) {
      subjectHint.textContent = "Could not create subject. Check Firestore setup.";
    }
    console.error(error);
  } finally {
    setSubjectFormState(false);
  }
}

if (loginButton) {
  loginButton.addEventListener("click", handleGoogleLogin);
}

if (subjectForm) {
  subjectForm.addEventListener("submit", handleCreateSubject);
}

if (subjectList) {
  subjectList.addEventListener("click", function (event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const subjectButton = target.closest("[data-subject-id]");
    if (!subjectButton) return;
    const subjectId = subjectButton.getAttribute("data-subject-id");
    if (!subjectId) return;
    openSubject(subjectId);
  });
}

if (notesForm) {
  notesForm.addEventListener("submit", handleNotesGenerate);
}

if (submitQuizBtn) {
  submitQuizBtn.addEventListener("click", evaluateQuizAnswers);
}

if (chatForm) {
  chatForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!chatInput) return;
    const message = chatInput.value.trim();
    if (!message) return;
    appendChatMessage("user", message);
    appendChatMessage("ai", buildAiResponse(message));
    chatInput.value = "";
  });
}

if (razorpayBtn) {
  razorpayBtn.addEventListener("click", handleRazorpayUpgrade);
}

if (submitRevisionBtn) {
  submitRevisionBtn.addEventListener("click", function () {
    evaluateRevisionQuiz().catch(console.error);
  });
}

sidebarLinks.forEach(function (button) {
  button.addEventListener("click", function () {
    const pageName = button.getAttribute("data-page") || "dashboard";
    showPage(pageName);
  });
});

document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "hidden") {
    flushUsageTime(true).catch(console.error);
  }
});

window.addEventListener("beforeunload", function () {
  flushUsageTime(true).catch(console.error);
});

setSignedOutView();
showPage("dashboard");
appendChatMessage("ai", "Hi! Upload notes to generate units, lessons, and a quiz.");

watchAuthState(async function (user) {
  if (user) {
    await setSignedInView(user);
  } else {
    setSignedOutView();
  }
});
