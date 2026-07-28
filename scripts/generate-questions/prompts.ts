export function buildSystemPrompt(certName: string): string {
  return `You are an experienced AWS certification exam-writer producing original practice questions for the ${certName} exam. Your questions will be studied by real candidates preparing for the actual certification, so accuracy and fidelity to the current exam guide matter more than cleverness.

Difficulty range: match the real exam's distribution — mostly EASY and MEDIUM questions, with roughly 20% HARD. EASY questions test a single fact or definition. MEDIUM questions require applying a concept to a short scenario. HARD questions require comparing two or three plausible AWS services or approaches and picking the one that best fits specific constraints (cost, availability, security, or operational overhead) mentioned in the scenario.

Format rules:
- Every question has exactly 4 options unless it is a multi-answer "select N" question, which should make up no more than 15% of any batch you generate.
- Multi-answer questions have exactly 2 correct answers in \`correctAnswers\`, and the question \`text\` must end with the literal phrase "(Choose two.)" so the candidate knows to select two options.
- Every option must be plausible on its face to someone who has only partially studied the material — never write a throwaway distractor that's obviously wrong (e.g. a made-up service name, or an option unrelated to the question's topic). Distractors should represent common misconceptions or adjacent-but-wrong AWS services/features.
- \`explanation\` is 1-2 sentences: a quick, blunt statement of why the correct answer is correct. This is what the candidate sees immediately after answering, so keep it tight.
- \`detailedExplanation\` is 3-6 sentences: explain WHY the correct answer is right, WHY each of the other (non-obvious) wrong answers is wrong, and fill in any underlying AWS concept the candidate needs to understand to avoid missing similar questions in the future.
- \`difficulty\` must be one of EASY, MEDIUM, or HARD, matching the real cognitive load of the question as described above.

Content rules:
- Never reference "Question #N", "Topic 1", exam-dump section numbers, or any other numbering/formatting that reveals this came from a generated batch rather than a real exam-style question bank.
- Do NOT copy phrasing, scenarios, or wording patterns from known exam-dump sites (ExamTopics, Braindumps, etc.). Every scenario must be an original situation you invent — a company name, a use case, a technical constraint — that tests the same underlying concept a real exam question would test.
- Do NOT reference AWS services, features, or console names that do not exist, are deprecated, or have been renamed (for example, do not use "Amazon Elastic Compute Cloud Classic", "Data Pipeline" as a current recommended service, or invent capabilities a service does not have). If you are not certain a service or feature currently exists as described, do not use it.
- Keep scenarios realistic and concise — 1-3 sentences of setup, then a clear question. Avoid padding with irrelevant detail.
- Vary company names, industries, and scenario framing across questions in the same batch so it doesn't read like a template was reused.

You will be given a domain, a concept checklist for that domain (drawn from the official CLF-C02 exam guide's task statements), a count of questions to produce, and a list of question texts that already exist in the question bank for this certification which you must NOT repeat or closely paraphrase — write questions that test different scenarios and angles on the same concepts instead.

QUALITY REQUIREMENTS (every question must satisfy all):
- Tests a published CLF-C02 exam objective (not generic AWS trivia).
- Exactly one option must be the single best answer. The remaining options should be technically incorrect or clearly less appropriate in the given scenario. Avoid questions where multiple answers could reasonably be defended.
- 4 options total. Never use "All of the above" or "None of the above".
- Prefer scenario-based framing (a company/situation) over pure recall — but not every question needs to be a scenario.
- Distractors must be realistic services or concepts that a beginner might reasonably confuse with the correct answer. Never joke options.
- explanation (1-2 sentences): why the correct answer is correct, in blunt plain language.
- detailedExplanation (3-6 sentences): explains WHY the correct answer is correct AND why each notable wrong answer is wrong. Include the AWS concept the learner needs to understand.
- Never reference "Question #N", "Topic 1", or any exam-dump formatting.
- Use current AWS service names — no deprecated names (e.g. use "AWS Systems Manager Parameter Store" not "AWS SSM Parameter Store" as informal).
- Do not repeat scenarios that appear in the "already covered" list passed with the prompt.

BATCH-LEVEL TARGET:
- Aim for roughly even distribution of correct answers across positions A/B/C/D within this batch. Perfect balance is not required — a 14-question batch might land at 3/4/3/4 or 4/3/4/3, which is fine. Just do not cluster correct answers heavily in one position.

You must call the provided tool to return your output. Do not return prose, markdown, or any text outside the tool call.`
}

export type DomainConcepts = {
  domain: string
  concepts: string[]
}

export const DOMAIN_CONCEPTS_BY_CERT: Record<string, Record<string, DomainConcepts>> = {
  "aws-cloud-practitioner": {
  "Cloud Concepts": {
    domain: "Cloud Concepts",
    concepts: [
      "Benefits of the AWS Cloud: agility, elasticity, high availability, fault tolerance, scalability (vertical vs horizontal), global reach, trading CapEx for OpEx",
      "AWS Well-Architected Framework's six pillars: operational excellence, security, reliability, performance efficiency, cost optimization, sustainability",
      "Design principles of the cloud: designing for failure, decoupling components, elasticity, automation over manual processes, going global in minutes",
      "AWS Cloud Adoption Framework (AWS CAF) perspectives: business, people, governance, platform, security, operations",
      "Migration strategies (the 6 R's): rehost, replatform, repurchase, refactor/re-architect, retain, retire",
      "Cloud economics: CapEx vs OpEx, total cost of ownership (TCO), economies of scale, pay-as-you-go pricing, eliminating guessing capacity needs",
    ],
  },
  "Security and Compliance": {
    domain: "Security and Compliance",
    concepts: [
      "AWS shared responsibility model: what AWS manages (security OF the cloud — hardware, global infrastructure, host OS/virtualization) vs what the customer manages (security IN the cloud — guest OS, data, IAM configuration, network/firewall configuration)",
      "Shared responsibility differences across service models (IaaS like EC2 vs managed services like RDS vs serverless like Lambda)",
      "AWS compliance programs and how customers access them: AWS Artifact for compliance reports and agreements (e.g. SOC, PCI DSS, ISO)",
      "Data privacy and customer data ownership: customers always retain ownership and control of their data",
      "AWS Identity and Access Management (IAM): users, groups, roles, policies (JSON policy documents), the principle of least privilege",
      "Root user vs IAM users: why the root user should not be used for daily tasks, and MFA on the root account",
      "Multi-factor authentication (MFA) as a security best practice",
      "IAM roles for cross-account access and for granting permissions to AWS services (e.g. an EC2 instance role) instead of embedding long-term credentials",
      "Security groups (stateful, instance-level virtual firewall) vs network ACLs (stateless, subnet-level)",
      "AWS WAF (web application firewall) and AWS Shield (DDoS protection, Standard vs Advanced)",
      "AWS Key Management Service (KMS) for encryption key management; encryption at rest and in transit generally",
      "Amazon GuardDuty (threat detection), Amazon Inspector (vulnerability scanning), AWS Trusted Advisor (best-practice checks including some security checks)",
      "AWS Organizations service control policies (SCPs) as a governance/compliance guardrail at the account level",
    ],
  },
  "Cloud Technology and Services": {
    domain: "Cloud Technology and Services",
    concepts: [
      "Deployment and operation methods: AWS Management Console, AWS CLI, AWS SDKs, and Infrastructure as Code via AWS CloudFormation",
      "Connectivity options: public internet, AWS Direct Connect (dedicated network connection), AWS Site-to-Site VPN",
      "AWS Global Infrastructure: Regions (isolated geographic areas), Availability Zones (one or more discrete data centers within a Region), Edge Locations / points of presence used by Amazon CloudFront",
      "Choosing a Region: factors like latency to users, cost, data residency/compliance, and service availability",
      "Compute services: Amazon EC2 (instance types, purchasing options at a conceptual level), AWS Lambda (serverless, event-driven, pay-per-invocation), Amazon ECS and Amazon EKS (containers), AWS Elastic Beanstalk (PaaS-style app deployment)",
      "Storage services: Amazon S3 (object storage, storage classes like Standard/Infrequent Access/Glacier), Amazon EBS (block storage attached to EC2), Amazon EFS (managed file storage, shared across multiple instances)",
      "Database services: Amazon RDS (managed relational database, multiple engines), Amazon DynamoDB (managed NoSQL, key-value), Amazon Redshift (data warehousing/analytics)",
      "Networking services: Amazon VPC (virtual private cloud, subnets, route tables, internet gateways), Elastic Load Balancing (distributing traffic across multiple targets), Amazon Route 53 (DNS and domain registration)",
      "Content delivery: Amazon CloudFront (CDN) and how it uses edge locations to reduce latency",
      "Auto Scaling for maintaining application availability and scaling compute capacity up or down automatically",
      "Resources for technology support: AWS documentation, whitepapers, AWS re:Post (community Q&A), and AWS Trusted Advisor recommendations across cost, performance, security, and fault tolerance",
    ],
  },
  "Billing, Pricing and Support": {
    domain: "Billing, Pricing and Support",
    concepts: [
      "AWS pricing models: On-Demand (pay for what you use, no commitment), Reserved Instances / Savings Plans (commitment for a discount), Spot Instances (spare capacity at a steep discount, can be interrupted)",
      "Free Tier: what it is and its general limitations (time-limited and/or usage-limited depending on the offer type)",
      "Consolidated Billing and AWS Organizations: combining usage across multiple accounts for volume pricing benefits and simplified billing",
      "AWS Cost Explorer: visualizing and analyzing historical cost and usage",
      "AWS Budgets: setting custom cost and usage alerts",
      "AWS Pricing Calculator: estimating the cost of AWS services before deploying them",
      "Billing alerts and AWS Billing Conductor concepts at a beginner level",
      "AWS Support plans: Basic (free, included for all), Developer, Business, and Enterprise — differences in response times, access to Technical Account Manager (TAM, Enterprise only), and support channels",
      "AWS Trusted Advisor's role in cost optimization recommendations (identifying idle/underutilized resources)",
      "AWS Marketplace as a source of third-party software offerings with AWS-integrated billing",
    ],
  },
  },
  // Future certs (az-900, associate-cloud-engineer, cka, hashicorp-terraform-associate, etc.) added here
}

export function getDomainConcepts(certSlug: string, domain: string): DomainConcepts | null {
  return DOMAIN_CONCEPTS_BY_CERT[certSlug]?.[domain] ?? null
}

export function buildUserPrompt({
  domain,
  certSlug,
  certName,
  count,
  existingQuestionTexts,
  sourceConcepts,
  gapConcepts,
}: {
  domain: string
  certSlug: string
  certName: string
  count: number
  existingQuestionTexts: string[]
  sourceConcepts?: string[]
  gapConcepts?: string[]
}): string {
  let conceptsIntro: string
  let concepts: string[]

  if (sourceConcepts && sourceConcepts.length > 0) {
    conceptsIntro =
      "These concepts come directly from user-provided reference material and are AUTHORITATIVE for this batch — do not substitute other AWS topics. Cover each concept below with exactly one question, in order, testing the specific concept as described:"
    concepts = sourceConcepts
  } else if (gapConcepts && gapConcepts.length > 0) {
    conceptsIntro =
      "These are official CLF-C02 domain objectives being used to fill coverage gaps that the user's source material did not address. Cover each concept below with exactly one question, in order:"
    concepts = gapConcepts
  } else {
    const domainInfo = getDomainConcepts(certSlug, domain)
    if (!domainInfo) {
      throw new Error(
        `Unknown domain "${domain}" for cert "${certSlug}". Known domains: ${Object.keys(DOMAIN_CONCEPTS_BY_CERT[certSlug] ?? {}).join(", ") || "(none configured for this cert)"}`
      )
    }
    conceptsIntro =
      "This domain covers the following concepts (from the official CLF-C02 exam guide task statements) — draw questions from across this list, not just the first few items:"
    concepts = domainInfo.concepts
  }

  const conceptList = concepts.map((c) => `- ${c}`).join("\n")

  const existingSection =
    existingQuestionTexts.length > 0
      ? `\n\nThe following ${existingQuestionTexts.length} question(s) already exist in this certification's question bank. Do NOT repeat them or write a close paraphrase of any of them — cover the same concept list from a different angle, scenario, or service combination instead:\n${existingQuestionTexts.map((t, i) => `${i + 1}. ${t}`).join("\n")}`
      : ""

  return `Generate exactly ${count} original practice questions for the domain "${domain}" of the ${certName} exam, for certSlug "${certSlug}".

${conceptsIntro}
${conceptList}

Difficulty distribution reminder: aim for roughly 40% EASY, 40% MEDIUM, 20% HARD across these ${count} questions. No more than 15% of the batch (round down, minimum 0) should be multi-answer "(Choose two.)" questions.${existingSection}

Return exactly ${count} questions via the tool call, each with certSlug set to "${certSlug}" and domain set to "${domain}".`
}

export function buildSourceExtractionPrompt(sourceText: string): string {
  return `You are analyzing a piece of AWS certification study material (provided by a learner) to identify what it teaches, so that practice exam questions can be written to match its content.

Read the source material below and extract:
1. "concepts": a list of concise, testable concept/topic phrases actually covered in this material — similar in granularity to an official exam objective (e.g. "IAM roles for cross-account access", "shared responsibility model"). Group closely related sub-points into ONE concept rather than splitting them out — aim for roughly one concept per major topic or heading in the source material, not one per sentence or sub-point. Only include concepts genuinely present in the text, not related AWS topics it happens not to mention.
2. "learningObjectives": a list of short "the learner should be able to..." style sentences describing what a reader of this material should know or be able to do afterward.

Do not invent concepts that are not actually discussed in the source material below. If the material is short, return a short list — do not pad it.

--- SOURCE MATERIAL START ---
${sourceText}
--- SOURCE MATERIAL END ---

You must call the provided tool to return your output. Do not return prose, markdown, or any text outside the tool call.`
}
