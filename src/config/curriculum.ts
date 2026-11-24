import type { LearningStage } from '@/types';
import { DEFAULT_USER_ID } from './personalPlan';

export interface TwelveWeekItem {
  week: number;
  title: string;
  stageRef: number;
}

export const FIRST_12_WEEK_CURRICULUM: TwelveWeekItem[] = [
  { week: 1, title: 'Computer fundamentals.', stageRef: 1 },
  { week: 2, title: 'Java programming, OOP and memory.', stageRef: 2 },
  { week: 3, title: 'Git, GitHub, Linux and command line.', stageRef: 4 },
  { week: 4, title: 'HTTP, DNS, TCP/IP and networking.', stageRef: 3 },
  { week: 5, title: 'HTML, CSS and JavaScript.', stageRef: 5 },
  { week: 6, title: 'Advanced JavaScript, asynchronous programming and event loop.', stageRef: 5 },
  { week: 7, title: 'TypeScript and React.', stageRef: 5 },
  { week: 8, title: 'Node.js and Express.', stageRef: 6 },
  { week: 9, title: 'REST APIs, authentication and authorization.', stageRef: 6 },
  { week: 10, title: 'PostgreSQL, SQL and database design.', stageRef: 7 },
  { week: 11, title: 'Redis, caching and database optimization.', stageRef: 7 },
  { week: 12, title: 'Docker, deployment and cloud fundamentals.', stageRef: 9 },
];

export const DSA_DAILY_STRUCTURE = [
  { minutes: 15, phase: 'Concept revision' },
  { minutes: 35, phase: 'Problem solving' },
  { minutes: 10, phase: 'Review mistakes and complexity' },
] as const;

export const DSA_RESOURCES = [
  { name: 'Striver / takeUforward', url: 'https://www.youtube.com/@takeUForward' },
  { name: 'LeetCode', url: 'https://leetcode.com/' },
  { name: 'NeetCode', url: 'https://neetcode.io/roadmap' },
] as const;

interface RawStage {
  stageNumber: number;
  title: string;
  description: string;
  objectives: string[];
  recommendedChannels: string[];
  externalResources: { label: string; url: string }[];
  weekMapping: string;
  concepts: string[];
  assignment: string;
}

const RAW_STAGES: RawStage[] = [
  {
    stageNumber: 1,
    title: 'Computer fundamentals',
    description: 'CPU, RAM, storage, binary, memory hierarchy.',
    objectives: ['Understand fetch-decode-execute cycle', 'Explain registers, L1/L2/L3 cache, RAM, and SSD hierarchy', 'Master binary, two’s complement, and data representation'],
    recommendedChannels: ['CrashCourse'],
    externalResources: [{ label: 'roadmap.sh Computer Science', url: 'https://roadmap.sh/computer-science' }],
    weekMapping: 'Week 1',
    concepts: ['CPU & ALU architecture', 'RAM & virtual memory basics', 'Storage & I/O subsystems', 'Binary & hexadecimal encoding', 'Memory hierarchy & locality'],
    assignment: 'Document how a C/Java program moves from disk into RAM, CPU caches, and registers.',
  },
  {
    stageNumber: 2,
    title: 'Programming foundations',
    description: 'Java, data types, control flow, functions, OOP, memory.',
    objectives: ['Write idiomatic Java with strong OOP modeling', 'Understand JVM stack vs heap allocation and garbage collection', 'Build clean collections-backed utilities'],
    recommendedChannels: ['Neso Academy'],
    externalResources: [{ label: 'Java Documentation', url: 'https://docs.oracle.com/en/java/' }],
    weekMapping: 'Week 2',
    concepts: ['Primitive vs reference types', 'Control flow & methods', 'Classes, interfaces, inheritance, polymorphism', 'JVM stack, heap & GC', 'Java Collections Framework'],
    assignment: 'Implement an in-memory CLI task scheduler in Java using interfaces, generics, and Collections.',
  },
  {
    stageNumber: 3,
    title: 'Core CS',
    description: 'Operating Systems, DBMS, Computer Networks, Computer Architecture.',
    objectives: ['Reason about processes, threads, scheduling, deadlocks, and paging', 'Normalize relational schemas and analyze ACID transactions', 'Trace DNS, TCP/IP, HTTP, and routing'],
    recommendedChannels: ['Gate Smashers'],
    externalResources: [{ label: 'roadmap.sh Computer Science', url: 'https://roadmap.sh/computer-science' }],
    weekMapping: 'Week 4 + Ongoing Sem VI',
    concepts: ['OS processes, threads & synchronization', 'CPU scheduling & virtual memory', 'DBMS normalization, indexing & ACID', 'Computer Networks: TCP/IP, HTTP, DNS', 'Computer Architecture & pipelining'],
    assignment: 'Write concise revision sheets for OS deadlocks, DBMS B+ trees, and TCP 3-way handshake.',
  },
  {
    stageNumber: 4,
    title: 'Developer workflow',
    description: 'Git, GitHub, Linux, command line, debugging, testing.',
    objectives: ['Work fluidly in Linux shell and Git branching/rebasing', 'Debug systematically with breakpoints and logs', 'Write automated unit and integration tests'],
    recommendedChannels: ['Fireship', 'MIT Missing Semester'],
    externalResources: [{ label: 'MIT Missing Semester', url: 'https://missing.csail.mit.edu/' }],
    weekMapping: 'Week 3',
    concepts: ['Git branching, rebase & conflict resolution', 'GitHub PRs & issue workflows', 'Linux filesystem, permissions & processes', 'Shell scripting & CLI tooling', 'Debugging & automated testing basics'],
    assignment: 'Configure dotfiles/aliases and complete a full PR workflow with rebase and unit tests.',
  },
  {
    stageNumber: 5,
    title: 'Frontend',
    description: 'HTML, CSS, responsive design, JavaScript, TypeScript, React, Next.js.',
    objectives: ['Craft accessible, mobile-first responsive UIs', 'Master async JavaScript, event loop, and strict TypeScript', 'Build production component architectures in React and Next.js'],
    recommendedChannels: ['Web Dev Simplified', 'Kevin Powell'],
    externalResources: [{ label: 'roadmap.sh Frontend', url: 'https://roadmap.sh/frontend' }],
    weekMapping: 'Weeks 5–7',
    concepts: ['Semantic HTML & modern CSS Grid/Flex', 'Responsive design & accessibility', 'JS event loop, closures & Promises', 'TypeScript strict types & generics', 'React state/hooks & Next.js fundamentals'],
    assignment: 'Build a responsive, keyboard-accessible interactive view with strict TypeScript and custom hooks.',
  },
  {
    stageNumber: 6,
    title: 'Backend',
    description: 'HTTP, REST, Node.js, Express, middleware, authentication, APIs.',
    objectives: ['Design clean RESTful APIs with validation and error contracts', 'Implement middleware pipelines, JWT/session auth, and RBAC', 'Handle rate limiting and structured logging'],
    recommendedChannels: ['Hussein Nasser', 'Java Guides'],
    externalResources: [{ label: 'roadmap.sh Backend', url: 'https://roadmap.sh/backend' }],
    weekMapping: 'Weeks 8–9',
    concepts: ['HTTP semantics, headers & status codes', 'REST API resource design', 'Node.js & Express middleware pipeline', 'Authentication, JWT & session security', 'Input validation & error handling'],
    assignment: 'Build a typed REST API with Zod validation, auth middleware, and integration tests.',
  },
  {
    stageNumber: 7,
    title: 'Databases',
    description: 'SQL, PostgreSQL, MySQL, MongoDB, indexing, Redis, Kafka.',
    objectives: ['Model relational data in PostgreSQL/MySQL and document stores in MongoDB', 'Optimize slow queries using EXPLAIN and composite indexes', 'Apply Redis caching and Kafka event streaming'],
    recommendedChannels: ['Hussein Nasser', 'IBM Technology'],
    externalResources: [{ label: 'roadmap.sh PostgreSQL', url: 'https://roadmap.sh/postgresql-dba' }],
    weekMapping: 'Weeks 10–11',
    concepts: ['SQL joins, CTEs & window functions', 'PostgreSQL & MySQL schema design', 'MongoDB document modeling', 'B-tree indexing & query plans', 'Redis caching & Kafka event streams'],
    assignment: 'Benchmark an unindexed vs indexed PostgreSQL query and add a Redis cache-aside layer.',
  },
  {
    stageNumber: 8,
    title: 'Software design',
    description: 'SOLID, design patterns, monoliths, microservices, distributed systems.',
    objectives: ['Apply SOLID principles and practical design patterns cleanly', 'Compare modular monoliths vs microservices trade-offs', 'Understand consensus, replication, partitioning, and consistency'],
    recommendedChannels: ['ByteByteGo', 'Gaurav Sen'],
    externalResources: [{ label: 'roadmap.sh System Design', url: 'https://roadmap.sh/system-design' }],
    weekMapping: 'Post-Week 12',
    concepts: ['SOLID principles & refactoring', 'Core GoF design patterns', 'Modular monolith vs microservices', 'Replication, sharding & CAP theorem', 'Queues, idempotency & distributed consensus'],
    assignment: 'Write an architecture decision record (ADR) for a distributed notification or rate-limiter service.',
  },
  {
    stageNumber: 9,
    title: 'Cloud and DevOps',
    description: 'AWS, Docker, Kubernetes, CI/CD, Terraform, monitoring.',
    objectives: ['Containerize multi-service apps cleanly with Docker', 'Automate test/build/deploy pipelines via GitHub Actions', 'Understand Kubernetes, Terraform IaC, AWS primitives, and observability'],
    recommendedChannels: ['TechWorld with Nana', 'Abhishek Veeramalla'],
    externalResources: [{ label: 'roadmap.sh DevOps', url: 'https://roadmap.sh/devops' }],
    weekMapping: 'Week 12 + Post-Week 12',
    concepts: ['Dockerfiles & multi-stage builds', 'AWS core compute, storage & IAM', 'CI/CD pipelines & automated checks', 'Kubernetes pods, services & deployments', 'Terraform IaC & Prometheus/Grafana monitoring'],
    assignment: 'Create a multi-stage Dockerfile and CI workflow with lint, typecheck, and build verification.',
  },
  {
    stageNumber: 10,
    title: 'Cybersecurity',
    description: 'Encryption, authentication, OWASP, SQL injection, XSS, secure coding.',
    objectives: ['Apply symmetric/asymmetric cryptography and TLS correctly', 'Mitigate OWASP Top 10 risks including SQLi, XSS, CSRF, and broken auth', 'Adopt secure secrets management and threat modeling'],
    recommendedChannels: ['IBM Technology', 'NetworkChuck'],
    externalResources: [{ label: 'OWASP Top 10', url: 'https://owasp.org/www-project-top-ten/' }],
    weekMapping: 'Post-Week 12',
    concepts: ['TLS, hashing & encryption basics', 'OAuth 2.0, OIDC & password hashing', 'OWASP Top 10 overview', 'Preventing SQL injection & XSS', 'Secure coding & secret hygiene'],
    assignment: 'Perform a security checklist audit on a web API covering headers, auth, and input sanitization.',
  },
  {
    stageNumber: 11,
    title: 'Mathematics for AI',
    description: 'Linear algebra, probability, statistics, calculus.',
    objectives: ['Understand vectors, matrices, eigenvalues, and SVD intuitively', 'Apply Bayes theorem, distributions, and hypothesis testing', 'Compute gradients, chain rule, and Jacobian intuition for optimization'],
    recommendedChannels: ['3Blue1Brown', 'StatQuest'],
    externalResources: [{ label: '3Blue1Brown Essence of Linear Algebra', url: 'https://www.3blue1brown.com/' }],
    weekMapping: 'Post-Week 12',
    concepts: ['Vectors, matrices & linear transformations', 'Eigenvalues, eigenvectors & SVD', 'Probability distributions & Bayes rule', 'Statistical inference & variance', 'Multivariable gradients & chain rule'],
    assignment: 'Implement matrix multiplication, cosine similarity, and gradient descent from scratch.',
  },
  {
    stageNumber: 12,
    title: 'Machine Learning',
    description: 'Regression, classification, clustering, PCA, evaluation.',
    objectives: ['Build end-to-end tabular ML pipelines without data leakage', 'Select proper evaluation metrics (F1, ROC-AUC, RMSE)', 'Apply dimensionality reduction and hyperparameter tuning'],
    recommendedChannels: ['StatQuest'],
    externalResources: [{ label: 'scikit-learn User Guide', url: 'https://scikit-learn.org/stable/user_guide.html' }],
    weekMapping: 'Post-Week 12',
    concepts: ['Linear & logistic regression', 'Trees, ensembles & classification', 'K-Means & clustering methods', 'PCA & dimensionality reduction', 'Cross-validation, bias-variance & metrics'],
    assignment: 'Train and evaluate a leak-free classification model with precision-recall analysis.',
  },
  {
    stageNumber: 13,
    title: 'Deep Learning',
    description: 'Neural networks, backpropagation, CNNs, transformers, PyTorch.',
    objectives: ['Implement autograd and MLPs from scratch and in PyTorch', 'Understand CNNs, residual blocks, normalization, and attention', 'Train, debug, and regularize deep neural architectures'],
    recommendedChannels: ['Andrej Karpathy', '3Blue1Brown'],
    externalResources: [{ label: 'PyTorch Tutorials', url: 'https://pytorch.org/tutorials/' }],
    weekMapping: 'Post-Week 12',
    concepts: ['Perceptrons, activations & loss functions', 'Backpropagation & optimization (AdamW)', 'CNNs & spatial representations', 'Self-attention & Transformer architecture', 'PyTorch tensors, Datasets & training loops'],
    assignment: 'Build micrograd-style autograd and train a small Transformer/MLP in PyTorch.',
  },
  {
    stageNumber: 14,
    title: 'NLP and language models',
    description: 'Tokenization, TF-IDF, embeddings, attention, BERT, GPT.',
    objectives: ['Compare BPE tokenization, TF-IDF, and dense vector embeddings', 'Understand encoder (BERT) vs decoder (GPT) language models', 'Build semantic search and classification workflows'],
    recommendedChannels: ['Andrej Karpathy', 'Hugging Face Learn'],
    externalResources: [{ label: 'Hugging Face NLP Course', url: 'https://huggingface.co/learn/nlp-course' }],
    weekMapping: 'Post-Week 12',
    concepts: ['BPE & subword tokenization', 'TF-IDF & sparse retrieval', 'Dense embeddings & cosine similarity', 'Masked LM (BERT) vs causal LM (GPT)', 'Fine-tuning & sequence classification'],
    assignment: 'Implement BPE tokenization and compare TF-IDF vs dense embeddings on a retrieval benchmark.',
  },
  {
    stageNumber: 15,
    title: 'Generative AI and LLMs',
    description: 'Pretraining, inference, fine-tuning, quantization, multimodal models.',
    objectives: ['Understand LLM pretraining, post-training (SFT/RLHF/DPO), and KV-cache inference', 'Apply LoRA/QLoRA fine-tuning and quantization trade-offs', 'Architect multimodal vision/text pipelines'],
    recommendedChannels: ['Andrej Karpathy', 'IBM Technology'],
    externalResources: [{ label: 'Hugging Face LLM Course', url: 'https://huggingface.co/learn' }],
    weekMapping: 'Post-Week 12',
    concepts: ['Pretraining scaling & data curation', 'KV cache, decoding & inference latency', 'SFT, LoRA & alignment basics', 'PTQ/QAT quantization (INT8/INT4)', 'Multimodal encoders & generation'],
    assignment: 'Profile quantized vs FP16 inference memory/latency and document fine-tuning trade-offs.',
  },
  {
    stageNumber: 16,
    title: 'AI Engineering',
    description: 'APIs, RAG, vector databases, agents, tool calling, MCP, evaluation, LLMOps.',
    objectives: ['Build production RAG pipelines with hybrid retrieval and reranking', 'Design reliable tool-calling agents and MCP servers', 'Measure quality with automated evals, tracing, and LLMOps guardrails'],
    recommendedChannels: ['IBM Technology', 'Hugging Face Learn'],
    externalResources: [{ label: 'Hugging Face Agents Course', url: 'https://huggingface.co/learn/agents-course' }],
    weekMapping: 'Post-Week 12',
    concepts: ['Structured outputs & LLM APIs', 'Chunking, vector DBs & hybrid RAG', 'Tool calling, agent loops & MCP', 'Automated evals & regression suites', 'LLMOps: caching, latency, cost & safety'],
    assignment: 'Ship an evaluated RAG + tool-calling service with MCP integration and latency/accuracy metrics.',
  },
];

export function createDefaultLearningStages(nowIso: string): LearningStage[] {
  return RAW_STAGES.map((stage) => ({
    id: `stage-${stage.stageNumber}`,
    userId: DEFAULT_USER_ID,
    stageNumber: stage.stageNumber,
    title: stage.title,
    description: stage.description,
    objectives: stage.objectives,
    recommendedChannels: stage.recommendedChannels,
    externalResources: stage.externalResources,
    weekMapping: stage.weekMapping,
    concepts: stage.concepts.map((title, index) => ({
      id: `stage-${stage.stageNumber}-c-${index + 1}`,
      title,
      completed: false,
    })),
    assignment: stage.assignment,
    notes: '',
    status: 'not_started',
    updatedAt: nowIso,
  }));
}
