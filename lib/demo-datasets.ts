// lib/demo-datasets.ts
//
// A library of ready-made subject datasets covering undergraduate through
// postgraduate computer-science coursework. Used by scripts/seed-demo.ts to
// populate a demo account, and by the goal builder as suggested starting
// points ("Study this instead of uploading a PDF").
//
// Each dataset is intentionally self-contained: topics, quiz questions, and
// flashcards, so the full agent loop (plan → study → quiz → mastery →
// adapt) works immediately without any upload.

export type Level = "undergraduate" | "postgraduate";

export interface DatasetQuestion {
  type: "mcq" | "true_false" | "fill_blank" | "short_answer" | "scenario";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface DatasetFlashcard {
  front: string;
  back: string;
}

export interface DatasetTopic {
  title: string;
  summary: string;
  estimatedMinutes: number;
  difficulty: "easy" | "medium" | "hard";
  questions: DatasetQuestion[];
  flashcards: DatasetFlashcard[];
}

export interface StudyDataset {
  slug: string;
  subject: string;
  level: Level;
  description: string;
  topics: DatasetTopic[];
}

export const DEMO_DATASETS: StudyDataset[] = [
  {
    slug: "network-security",
    subject: "Network Security",
    level: "undergraduate",
    description:
      "Core cryptography and network-defense concepts for a semester exam.",
    topics: [
      {
        title: "Symmetric Cryptography (DES/AES)",
        summary: "Block ciphers, key sizes, modes of operation.",
        estimatedMinutes: 45,
        difficulty: "medium",
        questions: [
          {
            type: "mcq",
            question: "AES supports which of the following key sizes?",
            options: ["56, 112, 168 bits", "128, 192, 256 bits", "64, 128, 256 bits", "40, 56, 128 bits"],
            correctAnswer: "128, 192, 256 bits",
            explanation: "AES was standardized with 128/192/256-bit keys, replacing DES's 56-bit key.",
            difficulty: "easy",
          },
          {
            type: "true_false",
            question: "ECB mode is recommended for encrypting large files because it is the fastest.",
            correctAnswer: "false",
            explanation: "ECB leaks patterns in plaintext (identical blocks → identical ciphertext); CBC/GCM are preferred.",
            difficulty: "medium",
          },
        ],
        flashcards: [
          { front: "DES key length", back: "56 bits effective (64-bit key with 8 parity bits)." },
          { front: "Why avoid ECB mode?", back: "Identical plaintext blocks produce identical ciphertext blocks, leaking structure." },
        ],
      },
      {
        title: "Public Key Cryptography (RSA)",
        summary: "Key generation, encryption/decryption, digital signatures.",
        estimatedMinutes: 50,
        difficulty: "hard",
        questions: [
          {
            type: "short_answer",
            question: "In RSA, what two numbers make up the public key?",
            correctAnswer: "n (modulus) and e (public exponent)",
            explanation: "The public key is (n, e); the private key is (n, d), where d is the modular inverse of e mod φ(n).",
            difficulty: "medium",
          },
          {
            type: "scenario",
            question: "Why is RSA rarely used to encrypt an entire large file directly?",
            correctAnswer: "It is computationally expensive; typically used to encrypt a symmetric session key instead (hybrid encryption).",
            explanation: "RSA operates on numbers smaller than the modulus and is slow relative to AES, so hybrid schemes are standard.",
            difficulty: "hard",
          },
        ],
        flashcards: [
          { front: "RSA public key components", back: "n (modulus), e (public exponent)." },
          { front: "Hybrid encryption", back: "Use RSA to exchange a symmetric key, then AES to encrypt the actual data." },
        ],
      },
      {
        title: "Hashing & Integrity (MD5/SHA)",
        summary: "Hash properties, collision resistance, HMAC.",
        estimatedMinutes: 35,
        difficulty: "medium",
        questions: [
          {
            type: "mcq",
            question: "Which property means it's infeasible to find two inputs with the same hash?",
            options: ["Pre-image resistance", "Collision resistance", "Determinism", "Avalanche effect"],
            correctAnswer: "Collision resistance",
            explanation: "Collision resistance specifically concerns finding any two distinct inputs that hash to the same output.",
            difficulty: "medium",
          },
        ],
        flashcards: [
          { front: "Is MD5 collision-resistant today?", back: "No — practical collisions have been demonstrated; avoid MD5 for security purposes." },
        ],
      },
      {
        title: "Number Theory Foundations",
        summary: "Modular arithmetic, Euler's totient, GCD — the math behind RSA.",
        estimatedMinutes: 40,
        difficulty: "hard",
        questions: [
          {
            type: "fill_blank",
            question: "Euler's totient function φ(p) for a prime p equals ____.",
            correctAnswer: "p - 1",
            explanation: "For a prime p, every number from 1 to p-1 is coprime to p, so φ(p) = p - 1.",
            difficulty: "medium",
          },
          {
            type: "short_answer",
            question: "What does the Extended Euclidean Algorithm compute that RSA key generation needs?",
            correctAnswer: "The modular multiplicative inverse of e mod φ(n), used as the private exponent d.",
            explanation: "RSA needs d such that e·d ≡ 1 (mod φ(n)); the extended Euclidean algorithm finds it.",
            difficulty: "hard",
          },
        ],
        flashcards: [
          { front: "φ(p) for prime p", back: "p − 1" },
          { front: "Role of Extended Euclidean Algorithm in RSA", back: "Finds the private exponent d, the modular inverse of e mod φ(n)." },
        ],
      },
      {
        title: "IPv4/IPv6 Addressing & Subnetting",
        summary: "Address classes, CIDR, subnet masks, address exhaustion.",
        estimatedMinutes: 55,
        difficulty: "hard",
        questions: [
          {
            type: "short_answer",
            question: "How many usable host addresses does a /28 subnet provide?",
            correctAnswer: "14",
            explanation: "/28 leaves 4 host bits → 16 addresses, minus network and broadcast = 14 usable.",
            difficulty: "hard",
          },
        ],
        flashcards: [
          { front: "Usable hosts in a /24", back: "254 (256 minus network and broadcast addresses)." },
          { front: "Why was IPv6 introduced?", back: "IPv4's ~4.3 billion address space was exhausted; IPv6 uses 128-bit addresses." },
        ],
      },
    ],
  },
  {
    slug: "dbms",
    subject: "Database Management Systems",
    level: "undergraduate",
    description: "Relational model, normalization, transactions, SQL.",
    topics: [
      {
        title: "Normalization (1NF–BCNF)",
        summary: "Functional dependencies and normal forms.",
        estimatedMinutes: 45,
        difficulty: "medium",
        questions: [
          {
            type: "mcq",
            question: "A relation in 2NF but not 3NF has what kind of dependency?",
            options: ["Partial dependency", "Transitive dependency", "Multivalued dependency", "No dependency"],
            correctAnswer: "Transitive dependency",
            explanation: "3NF removes transitive dependencies on the primary key that 2NF still allows.",
            difficulty: "medium",
          },
        ],
        flashcards: [
          { front: "1NF requirement", back: "All attribute values must be atomic (no repeating groups)." },
        ],
      },
      {
        title: "ACID Transactions",
        summary: "Atomicity, Consistency, Isolation, Durability.",
        estimatedMinutes: 30,
        difficulty: "easy",
        questions: [
          {
            type: "true_false",
            question: "Isolation guarantees that concurrent transactions never affect each other's outcome, as if executed serially.",
            correctAnswer: "true",
            explanation: "Isolation ensures the result is equivalent to some serial execution of the transactions.",
            difficulty: "easy",
          },
        ],
        flashcards: [
          { front: "ACID — Durability", back: "Once committed, a transaction's changes survive system failure." },
        ],
      },
      {
        title: "Indexing & Query Optimization",
        summary: "B+ trees, hashing indexes, query plans.",
        estimatedMinutes: 50,
        difficulty: "hard",
        questions: [
          {
            type: "short_answer",
            question: "Why are B+ trees preferred over binary search trees for disk-based indexes?",
            correctAnswer: "Higher fan-out reduces tree height, minimizing disk I/O per lookup.",
            explanation: "B+ trees are shallow and wide, matching disk block sizes to reduce the number of I/O operations.",
            difficulty: "hard",
          },
        ],
        flashcards: [
          { front: "Why B+ trees for DB indexes?", back: "High fan-out → fewer levels → fewer disk reads per query." },
        ],
      },
    ],
  },
  {
    slug: "operating-systems",
    subject: "Operating Systems",
    level: "undergraduate",
    description: "Processes, scheduling, memory management, concurrency.",
    topics: [
      {
        title: "CPU Scheduling Algorithms",
        summary: "FCFS, SJF, Round Robin, Priority scheduling.",
        estimatedMinutes: 40,
        difficulty: "medium",
        questions: [
          {
            type: "mcq",
            question: "Which scheduling algorithm can cause starvation of long processes?",
            options: ["Round Robin", "FCFS", "Shortest Job First", "FIFO"],
            correctAnswer: "Shortest Job First",
            explanation: "SJF can indefinitely postpone long jobs if short jobs keep arriving.",
            difficulty: "medium",
          },
        ],
        flashcards: [
          { front: "Round Robin's key parameter", back: "Time quantum — the fixed slice of CPU time each process gets." },
        ],
      },
      {
        title: "Deadlocks",
        summary: "Necessary conditions, prevention, avoidance, detection.",
        estimatedMinutes: 35,
        difficulty: "medium",
        questions: [
          {
            type: "short_answer",
            question: "Name the four necessary conditions for deadlock.",
            correctAnswer: "Mutual exclusion, hold and wait, no preemption, circular wait.",
            explanation: "All four must hold simultaneously for a deadlock to occur.",
            difficulty: "medium",
          },
        ],
        flashcards: [
          { front: "Banker's Algorithm purpose", back: "Deadlock avoidance by only granting requests that keep the system in a safe state." },
        ],
      },
      {
        title: "Virtual Memory & Paging",
        summary: "Page tables, TLBs, page replacement algorithms.",
        estimatedMinutes: 45,
        difficulty: "hard",
        questions: [
          {
            type: "true_false",
            question: "The Belady's anomaly means increasing page frames can sometimes increase page faults under FIFO replacement.",
            correctAnswer: "true",
            explanation: "This counterintuitive result is specific to FIFO and doesn't happen with LRU.",
            difficulty: "hard",
          },
        ],
        flashcards: [
          { front: "TLB", back: "Translation Lookaside Buffer — a cache of recent virtual-to-physical address translations." },
        ],
      },
    ],
  },
  {
    slug: "dsa",
    subject: "Data Structures & Algorithms",
    level: "undergraduate",
    description: "Core structures and algorithmic complexity analysis.",
    topics: [
      {
        title: "Time & Space Complexity",
        summary: "Big-O, Big-Ω, Big-Θ, amortized analysis.",
        estimatedMinutes: 30,
        difficulty: "easy",
        questions: [
          {
            type: "mcq",
            question: "What is the time complexity of binary search on a sorted array of n elements?",
            options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
            correctAnswer: "O(log n)",
            explanation: "Each comparison halves the search space.",
            difficulty: "easy",
          },
        ],
        flashcards: [{ front: "Amortized analysis", back: "Average cost per operation over a worst-case sequence, e.g. dynamic array resizing." }],
      },
      {
        title: "Trees & Balanced BSTs",
        summary: "AVL trees, Red-Black trees, tree traversals.",
        estimatedMinutes: 50,
        difficulty: "hard",
        questions: [
          {
            type: "short_answer",
            question: "What is the maximum balance factor allowed at any node in an AVL tree?",
            correctAnswer: "1 (heights of left and right subtrees differ by at most 1)",
            explanation: "This invariant is what keeps AVL tree operations at O(log n).",
            difficulty: "hard",
          },
        ],
        flashcards: [{ front: "Red-Black tree guarantee", back: "No root-to-leaf path is more than twice as long as any other, keeping operations O(log n)." }],
      },
      {
        title: "Graph Algorithms",
        summary: "BFS, DFS, Dijkstra, MST (Kruskal/Prim).",
        estimatedMinutes: 55,
        difficulty: "hard",
        questions: [
          {
            type: "mcq",
            question: "Dijkstra's algorithm fails to give correct results when the graph has:",
            options: ["Cycles", "Negative edge weights", "Disconnected components", "Undirected edges"],
            correctAnswer: "Negative edge weights",
            explanation: "Dijkstra assumes non-negative weights; use Bellman-Ford for graphs with negative edges.",
            difficulty: "medium",
          },
        ],
        flashcards: [{ front: "Kruskal's algorithm strategy", back: "Sort edges by weight, add the smallest edge that doesn't form a cycle (using union-find)." }],
      },
    ],
  },
  {
    slug: "machine-learning",
    subject: "Machine Learning",
    level: "postgraduate",
    description: "Supervised/unsupervised learning, evaluation, core algorithms.",
    topics: [
      {
        title: "Bias-Variance Tradeoff",
        summary: "Underfitting vs overfitting, regularization.",
        estimatedMinutes: 40,
        difficulty: "medium",
        questions: [
          {
            type: "scenario",
            question: "A model has low training error but high test error. What does this indicate, and what's one fix?",
            correctAnswer: "High variance / overfitting; fix with regularization, more data, or a simpler model.",
            explanation: "Low training error with high test error is the classic signature of overfitting.",
            difficulty: "medium",
          },
        ],
        flashcards: [{ front: "L2 regularization effect", back: "Penalizes large weights, shrinking them toward zero to reduce variance." }],
      },
      {
        title: "Gradient Descent & Optimization",
        summary: "Batch/stochastic/mini-batch GD, learning rate, Adam.",
        estimatedMinutes: 45,
        difficulty: "hard",
        questions: [
          {
            type: "short_answer",
            question: "Why can a learning rate that's too high cause training to diverge?",
            correctAnswer: "Updates overshoot the minimum, causing the loss to oscillate or increase instead of converge.",
            explanation: "Step sizes too large relative to the curvature of the loss surface prevent convergence.",
            difficulty: "hard",
          },
        ],
        flashcards: [{ front: "Adam optimizer combines", back: "Momentum (moving average of gradients) with per-parameter adaptive learning rates (RMSProp-like)." }],
      },
      {
        title: "Evaluation Metrics",
        summary: "Precision, recall, F1, ROC-AUC, confusion matrix.",
        estimatedMinutes: 35,
        difficulty: "medium",
        questions: [
          {
            type: "mcq",
            question: "In a highly imbalanced dataset (99% negative), which metric is most misleading?",
            options: ["Accuracy", "F1 score", "Recall", "Precision"],
            correctAnswer: "Accuracy",
            explanation: "A model predicting all-negative gets 99% accuracy while being useless — accuracy hides this.",
            difficulty: "medium",
          },
        ],
        flashcards: [{ front: "F1 score", back: "Harmonic mean of precision and recall; balances both in one number." }],
      },
      {
        title: "Neural Network Fundamentals",
        summary: "Backpropagation, activation functions, vanishing gradients.",
        estimatedMinutes: 55,
        difficulty: "hard",
        questions: [
          {
            type: "true_false",
            question: "ReLU activation eliminates the vanishing gradient problem entirely.",
            correctAnswer: "false",
            explanation: "ReLU mitigates it for positive inputs but introduces the 'dying ReLU' problem and doesn't eliminate vanishing gradients in deep nets entirely.",
            difficulty: "hard",
          },
        ],
        flashcards: [{ front: "Backpropagation", back: "Applies the chain rule to compute gradients of the loss w.r.t. every weight, layer by layer, backward." }],
      },
    ],
  },
  {
    slug: "distributed-systems",
    subject: "Distributed Systems",
    level: "postgraduate",
    description: "Consistency, consensus, fault tolerance at scale.",
    topics: [
      {
        title: "CAP Theorem",
        summary: "Consistency, Availability, Partition tolerance tradeoffs.",
        estimatedMinutes: 35,
        difficulty: "medium",
        questions: [
          {
            type: "scenario",
            question: "Under a network partition, why must a distributed system choose between consistency and availability?",
            correctAnswer: "Nodes can't communicate to agree on the latest value, so the system must either refuse requests (favor consistency) or serve possibly-stale data (favor availability).",
            explanation: "CAP theorem states you cannot have all three of consistency, availability, and partition tolerance during a partition.",
            difficulty: "hard",
          },
        ],
        flashcards: [{ front: "CAP theorem", back: "During a network partition, a system can guarantee at most one of Consistency or Availability, not both." }],
      },
      {
        title: "Consensus (Paxos/Raft)",
        summary: "Leader election, log replication, quorum.",
        estimatedMinutes: 60,
        difficulty: "hard",
        questions: [
          {
            type: "short_answer",
            question: "Why do consensus protocols like Raft require a majority quorum rather than unanimous agreement?",
            correctAnswer: "Majority quorums tolerate minority node failures while still guaranteeing overlap between any two quorums, preserving consistency.",
            explanation: "Requiring all nodes would make the system unavailable if even one node fails.",
            difficulty: "hard",
          },
        ],
        flashcards: [{ front: "Raft's three server states", back: "Leader, Follower, Candidate." }],
      },
      {
        title: "Distributed Transactions & 2PC",
        summary: "Two-phase commit, coordinator failure, alternatives (Saga).",
        estimatedMinutes: 45,
        difficulty: "hard",
        questions: [
          {
            type: "mcq",
            question: "What is the main weakness of Two-Phase Commit (2PC)?",
            options: [
              "It cannot guarantee atomicity",
              "The coordinator is a blocking single point of failure",
              "It only works with 2 nodes",
              "It requires no network communication",
            ],
            correctAnswer: "The coordinator is a blocking single point of failure",
            explanation: "If the coordinator crashes after the prepare phase, participants can be left blocked holding locks.",
            difficulty: "hard",
          },
        ],
        flashcards: [{ front: "Saga pattern", back: "A sequence of local transactions with compensating actions, avoiding 2PC's blocking coordinator." }],
      },
    ],
  },
  {
    slug: "cloud-computing",
    subject: "Cloud Computing",
    level: "postgraduate",
    description: "Service models, virtualization, scalability patterns.",
    topics: [
      {
        title: "Service Models (IaaS/PaaS/SaaS)",
        summary: "What each layer manages vs abstracts away.",
        estimatedMinutes: 25,
        difficulty: "easy",
        questions: [
          {
            type: "mcq",
            question: "In PaaS, which layer does the customer NOT need to manage?",
            options: ["Application code", "Runtime & OS", "Business logic", "Data model"],
            correctAnswer: "Runtime & OS",
            explanation: "PaaS abstracts away the OS/runtime, letting developers focus on application code.",
            difficulty: "easy",
          },
        ],
        flashcards: [{ front: "IaaS example", back: "AWS EC2 — you manage the OS and up; the provider manages hardware/virtualization." }],
      },
      {
        title: "Auto-scaling & Load Balancing",
        summary: "Horizontal vs vertical scaling, health checks.",
        estimatedMinutes: 35,
        difficulty: "medium",
        questions: [
          {
            type: "true_false",
            question: "Horizontal scaling means adding more powerful hardware to a single server.",
            correctAnswer: "false",
            explanation: "That's vertical scaling. Horizontal scaling adds more server instances.",
            difficulty: "easy",
          },
        ],
        flashcards: [{ front: "Horizontal vs vertical scaling", back: "Horizontal = more machines; vertical = a bigger machine." }],
      },
    ],
  },
  {
    slug: "compiler-design",
    subject: "Compiler Design",
    level: "postgraduate",
    description: "Lexical analysis through code generation.",
    topics: [
      {
        title: "Lexical Analysis & Parsing",
        summary: "Tokenization, grammars, LL vs LR parsing.",
        estimatedMinutes: 45,
        difficulty: "hard",
        questions: [
          {
            type: "short_answer",
            question: "What's the key difference between LL and LR parsers in terms of derivation?",
            correctAnswer: "LL parsers build a leftmost derivation top-down; LR parsers build a rightmost derivation bottom-up (in reverse).",
            explanation: "The naming reflects the derivation and scan direction used by each parsing strategy.",
            difficulty: "hard",
          },
        ],
        flashcards: [{ front: "Purpose of a symbol table", back: "Tracks identifiers, their types, and scope throughout compilation." }],
      },
      {
        title: "Intermediate Code & Optimization",
        summary: "Three-address code, control flow graphs, dead code elimination.",
        estimatedMinutes: 40,
        difficulty: "hard",
        questions: [
          {
            type: "mcq",
            question: "Constant folding is an example of which type of compiler optimization?",
            options: ["Local optimization", "Loop optimization", "Register allocation", "Peephole only"],
            correctAnswer: "Local optimization",
            explanation: "Constant folding evaluates constant expressions at compile time within a basic block.",
            difficulty: "medium",
          },
        ],
        flashcards: [{ front: "Dead code elimination", back: "Removes code whose result is never used, reducing output size and execution time." }],
      },
    ],
  },
];

export function getDatasetBySlug(slug: string) {
  return DEMO_DATASETS.find((d) => d.slug === slug);
}

export function listDatasetsForLevel(level?: Level) {
  if (!level) return DEMO_DATASETS;
  return DEMO_DATASETS.filter((d) => d.level === level);
}
