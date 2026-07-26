// prisma/seed.ts
// Original sample content — 8 questions across all 4 CLF-C02 domains,
// just enough to preview the practice exam UI before the full 390-question
// content pipeline is built. Not exam-dump content — written fresh, same
// underlying AWS concepts, different scenarios/wording.

import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

function toArray(correctAnswer: string): string[] {
  return correctAnswer.includes(', ') ? correctAnswer.split(', ') : [correctAnswer];
}

async function main() {
  const cert = await prisma.certification.upsert({
    where: { slug: 'aws-cloud-practitioner' },
    update: {},
    create: {
      vendor: 'AWS',
      name: 'AWS Certified Cloud Practitioner (CLF-C02)',
      slug: 'aws-cloud-practitioner',
      description:
        'The foundational AWS certification — covers cloud concepts, security, core services, and billing for anyone getting started with AWS.',
      logoSlug: 'amazonaws',
      domainWeights: {
        'Cloud Concepts': 0.24,
        'Security and Compliance': 0.30,
        'Cloud Technology and Services': 0.34,
        'Billing, Pricing and Support': 0.12,
      },
    },
  });

  await prisma.certification.upsert({
    where: { slug: 'az-900' },
    update: {},
    create: {
      vendor: 'Azure',
      name: 'Microsoft Azure Fundamentals (AZ-900)',
      slug: 'az-900',
      description: "Microsoft's foundational Azure certification. Cloud concepts and core services.",
      logoSlug: 'microsoftazure',
    },
  });

  await prisma.certification.upsert({
    where: { slug: 'associate-cloud-engineer' },
    update: {},
    create: {
      vendor: 'GCP',
      name: 'Associate Cloud Engineer',
      slug: 'associate-cloud-engineer',
      description:
        "Google Cloud's entry-level certification for deploying and managing GCP resources.",
      logoSlug: 'googlecloud',
    },
  });

  const questions = [
    {
      domain: 'Cloud Concepts',
      text: 'A startup currently spends heavily upfront on physical servers before they are needed. Which AWS cloud economics benefit most directly addresses this?',
      options: ['Elasticity', 'Trade capital expense for variable expense', 'Global infrastructure', 'Managed services'],
      correctAnswer: 'Trade capital expense for variable expense',
      quickExplanation: 'AWS lets you pay only for what you use instead of buying hardware upfront.',
      detailedExplanation: 'This is the "trade CapEx for OpEx" principle — instead of large upfront capital investment in data centers and servers, you pay AWS operating expenses based on actual usage. Elasticity is related but describes scaling up/down, not the financial shift itself.',
      difficulty: Difficulty.EASY,
    },
    {
      domain: 'Cloud Concepts',
      text: 'A company replaces its on-premises servers with serverless AWS services specifically so it can adopt new technologies faster after the migration. Which Well-Architected Framework pillar does this represent?',
      options: ['Security', 'Performance efficiency', 'Operational excellence', 'Reliability'],
      correctAnswer: 'Operational excellence',
      quickExplanation: 'Operational excellence covers running and evolving systems to deliver business value, including adopting new tech quickly.',
      detailedExplanation: 'Operational excellence includes the ability to support development and run workloads effectively, gain insight into operations, and continuously improve processes — which includes evolving quickly to adopt new technologies. Performance efficiency is about using resources efficiently, which is related but not the same as adoption speed.',
      difficulty: Difficulty.MEDIUM,
    },
    {
      domain: 'Security and Compliance',
      text: 'A company wants to ensure that only specific IAM users can access an S3 bucket containing financial records, regardless of any other permissions granted. Which approach should they use?',
      options: ['IAM user policy', 'S3 bucket policy', 'S3 ACL', 'S3 bucket policy with an explicit Deny for all other principals'],
      correctAnswer: 'S3 bucket policy with an explicit Deny for all other principals',
      quickExplanation: 'An explicit Deny in a bucket policy overrides any Allow, making it the strongest way to restrict access regardless of other permissions.',
      detailedExplanation: 'IAM policies and S3 bucket policies are evaluated together, and AWS uses an explicit-deny-wins model — if any applicable policy denies an action, it is denied even if another policy allows it. Bucket policies can be scoped to "all principals except X," which a single IAM user policy cannot express on its own. ACLs are the older, less flexible option, and AWS recommends disabling them in favor of policies.',
      difficulty: Difficulty.MEDIUM,
    },
    {
      domain: 'Security and Compliance',
      text: 'A company runs its application on AWS Lambda. Which of the following are the company\'s own responsibility under the AWS shared responsibility model? (Choose two.)',
      options: ['Patching the underlying operating system', 'Securing the physical data center', 'Writing and updating the function code', 'Security configuration within the application code', 'Maintaining the Lambda service availability'],
      correctAnswer: 'Writing and updating the function code, Security configuration within the application code',
      quickExplanation: 'With Lambda, AWS manages the infrastructure and OS; the customer is responsible for their code and how it handles security.',
      detailedExplanation: 'Lambda is a serverless compute service, so AWS manages the underlying servers, OS patching, and physical security as part of "security of the cloud." The customer remains responsible for "security in the cloud" — writing secure code, managing application-level permissions, and updating their own function logic.',
      difficulty: Difficulty.MEDIUM,
    },
    {
      domain: 'Cloud Technology and Services',
      text: 'A company is launching a global marketing site with videos that must load with low latency for users worldwide. Which AWS service best meets this requirement?',
      options: ['AWS Auto Scaling', 'Amazon Kinesis Video Streams', 'Elastic Load Balancing', 'Amazon CloudFront'],
      correctAnswer: 'Amazon CloudFront',
      quickExplanation: 'CloudFront is a CDN that caches content at edge locations close to users worldwide, reducing latency.',
      detailedExplanation: 'Amazon CloudFront is a content delivery network that caches static and dynamic content at edge locations around the world, so users retrieve content from a nearby location instead of the origin server. Auto Scaling and Elastic Load Balancing help with compute capacity and traffic distribution, but neither directly reduces content delivery latency the way a CDN does. Kinesis Video Streams is for ingesting and processing video streams, not delivering pre-recorded video globally.',
      difficulty: Difficulty.EASY,
    },
    {
      domain: 'Cloud Technology and Services',
      text: 'A company has separate AWS accounts per department, each with its own Reserved Instances. Some departments have unused Reserved Instances while others need more than they purchased. Which AWS service lets the company share Reserved Instance capacity across accounts?',
      options: ['AWS Systems Manager', 'Cost Explorer', 'AWS Trusted Advisor', 'AWS Organizations'],
      correctAnswer: 'AWS Organizations',
      quickExplanation: 'AWS Organizations enables consolidated billing, which automatically shares Reserved Instance discounts across accounts in the organization.',
      detailedExplanation: 'AWS Organizations allows multiple accounts to be linked under consolidated billing. Reserved Instance billing benefits (and Savings Plans) are automatically shared across all accounts in the organization, so unused capacity in one account can benefit usage in another. Cost Explorer and Trusted Advisor provide visibility and recommendations but do not enable the sharing itself; Systems Manager is unrelated to billing.',
      difficulty: Difficulty.MEDIUM,
    },
    {
      domain: 'Billing, Pricing and Support',
      text: 'Which AWS Support plan is the first tier to include 24/7 access to Cloud Support Engineers via phone, chat, and email, along with full AWS Trusted Advisor checks?',
      options: ['Basic', 'Developer', 'Business', 'Enterprise'],
      correctAnswer: 'Business',
      quickExplanation: 'Business is the first plan with full 24/7 support across all channels and complete Trusted Advisor checks.',
      detailedExplanation: 'Basic and Developer only offer business-hours or limited support channels. The Business plan adds 24/7 access via phone, chat, and email, plus faster response times for production-down issues and the full set of Trusted Advisor checks — appropriate once a company runs production workloads. Enterprise adds a dedicated Technical Account Manager on top of everything Business includes.',
      difficulty: Difficulty.EASY,
    },
    {
      domain: 'Billing, Pricing and Support',
      text: 'An application on Amazon EC2 cannot tolerate interruption and has a predictable usage baseline with a few weeks of seasonal spikes each year. The application cannot be modified. Which purchasing strategy is MOST cost-effective?',
      options: [
        'Buy Reserved Instances to cover all potential peak usage including seasonal spikes',
        'Buy Reserved Instances for the predictable baseline and run seasonal spikes on Spot Instances',
        'Buy Reserved Instances for the predictable baseline and run seasonal spikes at the On-Demand rate',
        'Run all usage, including the baseline, on Spot Instances',
      ],
      correctAnswer: 'Buy Reserved Instances for the predictable baseline and run seasonal spikes at the On-Demand rate',
      quickExplanation: 'Reserve for the steady baseline to save money there, and use On-Demand (not Spot) for the short unpredictable spikes since the workload cannot tolerate interruption.',
      detailedExplanation: 'Reserved Instances offer the best discount for steady, predictable usage, so covering the baseline with RIs minimizes cost for the majority of usage. Because the workload cannot tolerate interruption, Spot Instances are not a safe choice for the seasonal spikes, since Spot capacity can be reclaimed by AWS with short notice. On-Demand costs more per hour but guarantees availability without interruption risk, making it the right fit for short, unpredictable, interruption-intolerant spikes. Buying RIs for peak usage would mean paying for unused reserved capacity most of the year.',
      difficulty: Difficulty.HARD,
    },
  ];

  const createdQuestionIds: string[] = [];
  for (const q of questions) {
    const created = await prisma.question.create({
      data: {
        certId: cert.id,
        domain: q.domain,
        text: q.text,
        options: q.options,
        correctAnswers: toArray(q.correctAnswer),
        explanation: q.quickExplanation,
        detailedExplanation: q.detailedExplanation,
        difficulty: q.difficulty,
      },
    });
    createdQuestionIds.push(created.id);
  }

  console.log(`Seeded ${questions.length} sample questions for ${cert.name}`);

  const practiceSet = await prisma.practiceSet.upsert({
    where: { certId_number: { certId: cert.id, number: 1 } },
    update: {},
    create: {
      certId: cert.id,
      number: 1,
      name: 'Practice Exam 1',
      description: 'All seeded questions across every CLF-C02 domain.',
    },
  });

  await prisma.question.updateMany({
    where: { id: { in: createdQuestionIds } },
    data: { practiceSetId: practiceSet.id },
  });

  console.log(`Assigned ${createdQuestionIds.length} questions to "${practiceSet.name}"`);

  await prisma.studyNote.create({
    data: {
      certId: cert.id,
      domain: 'Cloud Concepts',
      title: 'Shared Responsibility Model overview',
      contentMd: `## Shared Responsibility Model

AWS splits security duties between itself and the customer. AWS is responsible for
**security of the cloud** — the physical data centers, hardware, networking, and the
managed services' underlying infrastructure. Customers are responsible for
**security in the cloud** — how they configure what they run on top of that
infrastructure.

For an EC2-based workload, that means AWS patches the host hypervisor and secures the
building, while you patch the guest OS, manage security groups, and encrypt your data.
For a fully managed service like Lambda or S3, AWS takes on more of the stack (OS
patching, scaling), but you still own access policies, data classification, and
client-side configuration.

The split shifts service by service — more abstracted services push more
responsibility to AWS — but the customer is never fully hands-off. Knowing where the
line falls for a given service is one of the most commonly tested concepts on the
exam.`,
    },
  });

  await prisma.resource.createMany({
    data: [
      {
        certId: cert.id,
        title: 'AWS Certified Cloud Practitioner — Official page',
        url: 'https://aws.amazon.com/certification/certified-cloud-practitioner/',
        type: 'official',
      },
      {
        certId: cert.id,
        title: 'CLF-C02 Exam Guide (PDF)',
        url: 'https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02.html',
        type: 'official',
      },
    ],
  });

  console.log('Seeded 1 study note and 2 resources');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });