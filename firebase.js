import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  addDoc,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Replace with your Firebase project configuration.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

function buildInitialUserDoc(user) {
  return {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || "Learner",
    photoURL: user.photoURL || "",
    energy: 0,
    streak: 0,
    dailyUsage: {},
    lastActiveDate: "",
    plan: "free",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

function buildStarterUnits() {
  return [
    {
      title: "Unit 1: Foundations",
      order: 1,
      unlocked: true,
      isCompleted: false,
      subunits: [
        { title: "Intro Basics", isCompleted: false },
        { title: "Core Vocabulary", isCompleted: false }
      ]
    },
    {
      title: "Unit 2: Practice",
      order: 2,
      unlocked: false,
      isCompleted: false,
      subunits: [
        { title: "Guided Exercises", isCompleted: false },
        { title: "Checkpoint Quiz", isCompleted: false }
      ]
    },
    {
      title: "Unit 3: Application",
      order: 3,
      unlocked: false,
      isCompleted: false,
      subunits: [
        { title: "Scenario Practice", isCompleted: false },
        { title: "Mini Project", isCompleted: false }
      ]
    }
  ];
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  await setDoc(doc(db, "users", user.uid), buildInitialUserDoc(user), {
    merge: true
  });

  return user;
}

export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function createSubject(uid, subjectName) {
  const trimmedName = subjectName.trim();
  if (!uid || !trimmedName) {
    throw new Error("uid and subjectName are required.");
  }

  const subjectRef = await addDoc(collection(db, "users", uid, "subjects"), {
    name: trimmedName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  const starterUnits = buildStarterUnits();
  const unitWrites = starterUnits.map(function (unit) {
    return addDoc(collection(db, "users", uid, "subjects", subjectRef.id, "units"), {
      ...unit,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });

  await Promise.all(unitWrites);

  return subjectRef.id;
}

export async function listSubjects(uid) {
  if (!uid) return [];
  const subjectsQuery = query(
    collection(db, "users", uid, "subjects"),
    orderBy("createdAt", "asc")
  );
  const snapshot = await getDocs(subjectsQuery);
  return snapshot.docs.map(function (item) {
    return { id: item.id, ...item.data() };
  });
}

export async function listUnits(uid, subjectId) {
  if (!uid || !subjectId) return [];
  const unitsQuery = query(
    collection(db, "users", uid, "subjects", subjectId, "units"),
    orderBy("order", "asc")
  );
  const snapshot = await getDocs(unitsQuery);
  return snapshot.docs.map(function (item) {
    return { id: item.id, ...item.data() };
  });
}

export async function updateUserPlan(uid, plan) {
  if (!uid || !plan) {
    throw new Error("uid and plan are required.");
  }
  await setDoc(
    doc(db, "users", uid),
    {
      plan: plan,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function saveWeakTopics(uid, weakTopics) {
  if (!uid) {
    throw new Error("uid is required.");
  }
  await setDoc(
    doc(db, "users", uid),
    {
      weakTopics: weakTopics,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function getUserProfile(uid) {
  if (!uid) return null;
  const snapshot = await getDoc(doc(db, "users", uid));
  if (!snapshot.exists()) return null;
  return snapshot.data();
}

export async function updateUserLearningMetrics(uid, metrics) {
  if (!uid || !metrics || typeof metrics !== "object") {
    throw new Error("uid and metrics object are required.");
  }
  await setDoc(
    doc(db, "users", uid),
    {
      ...metrics,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}
