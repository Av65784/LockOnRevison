export interface Lesson {
  id: string;
  title: string;
  content: string[];
  completed: boolean;
}

export interface Quiz {
  id: string;
  questions: QuizQuestion[];
  score: number | null;
  passed: boolean | null;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Unit {
  id: string;
  title: string;
  lessons: Lesson[];
  quiz: Quiz;
  unlocked: boolean;
  completed: boolean;
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  units: Unit[];
  progress: number;
}

export interface UserProfile {
  name: string;
  xp: number;
  energy: number;
  maxEnergy: number;
  streak: number;
  subjects: Subject[];
}

export const mockUser: UserProfile = {
  name: "Alex",
  xp: 1250,
  energy: 4,
  maxEnergy: 5,
  streak: 7,
  subjects: [
    {
      id: "physics",
      name: "Physics",
      icon: "⚛️",
      color: "energy",
      progress: 60,
      units: [
        {
          id: "mechanics",
          title: "Mechanics",
          unlocked: true,
          completed: true,
          lessons: [
            { id: "l1", title: "Newton's Laws", content: [
              "Newton's First Law states that an object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force.",
              "This is also known as the Law of Inertia. Inertia is the tendency of an object to resist changes in its state of motion.",
              "Example: A ball rolling on a frictionless surface will keep rolling forever."
            ], completed: true },
            { id: "l2", title: "Forces & Motion", content: [
              "Newton's Second Law: F = ma. Force equals mass times acceleration.",
              "The greater the force applied to an object, the greater its acceleration. The greater the mass, the less the acceleration.",
              "Units: Force is measured in Newtons (N), mass in kilograms (kg), acceleration in m/s²."
            ], completed: true },
          ],
          quiz: {
            id: "q1",
            score: 100,
            passed: true,
            questions: [
              { id: "qq1", question: "What does F = ma represent?", options: ["Newton's First Law", "Newton's Second Law", "Newton's Third Law", "Law of Gravity"], correctIndex: 1 },
              { id: "qq2", question: "What is inertia?", options: ["A type of force", "Resistance to change in motion", "A unit of measurement", "A type of energy"], correctIndex: 1 },
              { id: "qq3", question: "Force is measured in?", options: ["Joules", "Watts", "Newtons", "Pascals"], correctIndex: 2 },
            ]
          }
        },
        {
          id: "thermodynamics",
          title: "Thermodynamics",
          unlocked: true,
          completed: false,
          lessons: [
            { id: "l3", title: "Heat & Temperature", content: [
              "Temperature is a measure of the average kinetic energy of particles in a substance.",
              "Heat is the transfer of thermal energy between objects at different temperatures.",
              "The three methods of heat transfer are: conduction, convection, and radiation."
            ], completed: true },
            { id: "l4", title: "Laws of Thermodynamics", content: [
              "The First Law: Energy cannot be created or destroyed, only transformed.",
              "The Second Law: In any energy transfer, some energy is always lost as heat, increasing entropy.",
              "Entropy is a measure of disorder in a system. The universe tends toward maximum entropy."
            ], completed: false },
          ],
          quiz: {
            id: "q2",
            score: null,
            passed: null,
            questions: [
              { id: "qq4", question: "What is temperature a measure of?", options: ["Total energy", "Average kinetic energy", "Potential energy", "Chemical energy"], correctIndex: 1 },
              { id: "qq5", question: "Which is NOT a method of heat transfer?", options: ["Conduction", "Convection", "Compression", "Radiation"], correctIndex: 2 },
              { id: "qq6", question: "What does entropy measure?", options: ["Temperature", "Pressure", "Disorder", "Volume"], correctIndex: 2 },
            ]
          }
        },
        {
          id: "waves",
          title: "Waves & Optics",
          unlocked: false,
          completed: false,
          lessons: [
            { id: "l5", title: "Wave Properties", content: [
              "A wave is a disturbance that transfers energy through matter or space.",
              "Key properties: wavelength, frequency, amplitude, and speed.",
              "The wave equation: v = fλ (speed = frequency × wavelength)."
            ], completed: false },
            { id: "l6", title: "Light & Reflection", content: [
              "Light is an electromagnetic wave that travels at approximately 3 × 10⁸ m/s in a vacuum.",
              "The law of reflection: angle of incidence = angle of reflection.",
              "Mirrors form images through reflection. The type of image depends on the mirror shape."
            ], completed: false },
          ],
          quiz: {
            id: "q3",
            score: null,
            passed: null,
            questions: [
              { id: "qq7", question: "What is the wave equation?", options: ["v = fλ", "E = mc²", "F = ma", "P = IV"], correctIndex: 0 },
              { id: "qq8", question: "Speed of light in vacuum?", options: ["3 × 10⁶ m/s", "3 × 10⁸ m/s", "3 × 10¹⁰ m/s", "3 × 10⁴ m/s"], correctIndex: 1 },
              { id: "qq9", question: "Law of reflection states?", options: ["Light bends", "Angle in = Angle out", "Light splits", "Light absorbs"], correctIndex: 1 },
            ]
          }
        }
      ]
    },
    {
      id: "math",
      name: "Mathematics",
      icon: "📐",
      color: "primary",
      progress: 30,
      units: [
        {
          id: "algebra",
          title: "Algebra Basics",
          unlocked: true,
          completed: true,
          lessons: [
            { id: "ml1", title: "Variables & Expressions", content: [
              "A variable is a symbol (usually a letter) that represents an unknown value.",
              "An expression is a combination of variables, numbers, and operations.",
              "Example: 3x + 5 is an expression where x is a variable."
            ], completed: true },
            { id: "ml2", title: "Solving Equations", content: [
              "To solve an equation, isolate the variable on one side.",
              "Whatever you do to one side, you must do to the other side.",
              "Example: 2x + 3 = 11 → 2x = 8 → x = 4"
            ], completed: true },
          ],
          quiz: {
            id: "mq1",
            score: 80,
            passed: true,
            questions: [
              { id: "mqq1", question: "Solve: 2x + 6 = 12", options: ["x = 2", "x = 3", "x = 4", "x = 6"], correctIndex: 1 },
              { id: "mqq2", question: "What is a variable?", options: ["A number", "An operation", "A symbol for unknown", "A constant"], correctIndex: 2 },
            ]
          }
        },
        {
          id: "geometry",
          title: "Geometry",
          unlocked: true,
          completed: false,
          lessons: [
            { id: "ml3", title: "Shapes & Angles", content: [
              "A triangle has three sides and three angles that sum to 180°.",
              "A right angle is exactly 90°. An acute angle is less than 90°. An obtuse angle is between 90° and 180°.",
              "The area of a triangle = ½ × base × height."
            ], completed: false },
          ],
          quiz: {
            id: "mq2",
            score: null,
            passed: null,
            questions: [
              { id: "mqq3", question: "Sum of angles in a triangle?", options: ["90°", "180°", "270°", "360°"], correctIndex: 1 },
            ]
          }
        }
      ]
    },
    {
      id: "chemistry",
      name: "Chemistry",
      icon: "🧪",
      color: "streak",
      progress: 0,
      units: [
        {
          id: "atoms",
          title: "Atomic Structure",
          unlocked: true,
          completed: false,
          lessons: [
            { id: "cl1", title: "The Atom", content: [
              "An atom is the smallest unit of matter that retains chemical properties.",
              "Atoms consist of protons, neutrons, and electrons.",
              "Protons and neutrons are in the nucleus; electrons orbit around it."
            ], completed: false },
          ],
          quiz: {
            id: "cq1",
            score: null,
            passed: null,
            questions: [
              { id: "cqq1", question: "What particles are in the nucleus?", options: ["Electrons only", "Protons & Neutrons", "Neutrons only", "All three"], correctIndex: 1 },
            ]
          }
        }
      ]
    }
  ]
};
