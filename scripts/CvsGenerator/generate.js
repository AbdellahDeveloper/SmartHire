// generate.js
import fs from "fs";
import path from "path";
import minimist from "minimist";
import { faker } from "@faker-js/faker";
import puppeteer from "puppeteer";
import { createObjectCsvWriter as createCsvWriter } from "csv-writer";

// ========== CONFIG & HELPERS ==========
const args = minimist(process.argv.slice(2), {
  string: ["professions", "out", "seed"],
  boolean: ["pdf", "json", "noise"],
  default: {
    count: 10,
    pdf: true,
    json: true,
    out: "./cvs",
    concurrency: 3,
    noise: true,
  },
});

const COUNT = Number(args.count || 10);
const OUT_DIR = args.out;
const GENERATE_PDF = args.pdf !== false;
const GENERATE_JSON = args.json !== false;
const CONCURRENCY = Number(args.concurrency || 3);
const SEED = args.seed ? Number(args.seed) : undefined;
const NOISE = !!args.noise;
const PROF_FILTER = args.professions
  ? args.professions.split(",").map((s) => s.trim())
  : null;

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

if (SEED !== undefined) faker.seed(SEED);

// small utility for random choice
const rand = (arr) =>
  arr[Math.floor(faker.number.int({ min: 0, max: arr.length - 1 }))];
const chance = (p) => faker.number.int({ min: 1, max: 100 }) <= p;

// ========== PROFESSION TEMPLATES ==========
/*
 Each profession object contains:
 - groups: the grouped skill sets (array of {groupName, skills[]})
 - titles: plausible job titles
 - industries: industry strings
 - certs: plausible certifications
 - edu: plausible education templates
 - typicalBulletsGenerators: array of functions producing bullet points
*/

const professionCatalog = {
  software_engineer: {
    display: "Software Engineer",
    groups: [
      {
        group: "Languages",
        skills: [
          "JavaScript",
          "TypeScript",
          "Python",
          "Go",
          "C#",
          "Java",
          "Ruby",
        ],
      },
      {
        group: "Frontend",
        skills: [
          "React",
          "Vue",
          "Angular",
          "Next.js",
          "HTML",
          "CSS",
          "Tailwind CSS",
        ],
      },
      {
        group: "Backend",
        skills: [
          "Node.js",
          "Express",
          "Django",
          "Flask",
          "Spring",
          "GraphQL",
          "REST",
        ],
      },
      {
        group: "Data & Storage",
        skills: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch"],
      },
      {
        group: "Cloud & DevOps",
        skills: ["AWS", "GCP", "Azure", "Docker", "Kubernetes", "CI/CD"],
      },
      {
        group: "Testing & Tools",
        skills: ["Jest", "Cypress", "Mocha", "Sentry", "New Relic"],
      },
      {
        group: "Soft Skills",
        skills: [
          "Code Reviews",
          "Mentorship",
          "Agile",
          "Communication",
          "Product Collaboration",
        ],
      },
    ],
    titles: [
      "Software Engineer",
      "Frontend Engineer",
      "Backend Engineer",
      "Full-Stack Engineer",
      "SRE",
      "Platform Engineer",
    ],
    industries: ["SaaS", "FinTech", "Healthcare", "E-commerce", "AI/ML"],
    certs: [
      "AWS Certified Developer",
      "Google Associate Cloud Engineer",
      "Certified Kubernetes Administrator",
    ],
    edu: [
      "B.Sc. Computer Science",
      "M.Sc. Software Engineering",
      "B.Eng. Computer Engineering",
    ],
    bullets: (role) => [
      `${role} designed and implemented ${rand(["microservices", "scalable APIs", "real-time features"])} serving ${faker.number.int({ min: 1000, max: 100000 })}+ users.`,
      `Improved request latency by ${faker.number.int({ min: 10, max: 70 })}% through ${rand(["query optimization", "caching", "profiling and refactors"])}.`,
      `Led migration to ${rand(["Kubernetes", "serverless functions", "multi-region deployment"])}, improving resilience and deployment velocity.`,
      `Authored automated tests and reduced regression incidents by ${faker.number.int({ min: 20, max: 80 })}%.`,
    ],
  },

  chef: {
    display: "Chef",
    groups: [
      {
        group: "Cuisine Styles",
        skills: [
          "Italian",
          "French",
          "Mediterranean",
          "Asian Fusion",
          "Plant-based",
          "Pastry",
        ],
      },
      {
        group: "Kitchen Skills",
        skills: [
          "Butchery",
          "Sauce-making",
          "Baking",
          "Plating",
          "Menu Design",
          "Cost Control",
        ],
      },
      {
        group: "Operations",
        skills: [
          "HACCP",
          "Inventory Management",
          "Supplier Negotiation",
          "Catering",
          "Event Planning",
        ],
      },
      {
        group: "Soft Skills",
        skills: [
          "Team Leadership",
          "Training",
          "Time Management",
          "Quality Control",
        ],
      },
    ],
    titles: [
      "Executive Chef",
      "Sous Chef",
      "Pastry Chef",
      "Line Cook",
      "Private Chef",
    ],
    industries: ["Fine Dining", "Hotels", "Catering", "Private Events"],
    certs: [
      "HACCP Level 3",
      "Food Safety Manager",
      "Certified Sommelier (optional)",
    ],
    edu: ["Diploma in Culinary Arts", "B.A. Hospitality Management"],
    bullets: (role) => [
      `Designed seasonal menu increasing revenue by ${faker.number.int({ min: 5, max: 40 })}% through optimized dish pricing.`,
      `Managed kitchen of ${faker.number.int({ min: 5, max: 30 })} staff, implementing cross-training and reducing labor overtime.`,
      `Maintained food cost under ${faker.number.int({ min: 20, max: 35 })}% with vendor negotiations and waste controls.`,
      `Catered private events for up to ${faker.number.int({ min: 50, max: 300 })} guests with 95%+ client satisfaction.`,
    ],
  },

  hr_manager: {
    display: "HR Manager",
    groups: [
      {
        group: "Talent",
        skills: ["Recruitment", "Sourcing", "Onboarding", "Employer Branding"],
      },
      {
        group: "Operations",
        skills: [
          "HRIS (Workday/BambooHR)",
          "Payroll Coordination",
          "Benefits Administration",
        ],
      },
      {
        group: "People Practices",
        skills: [
          "Performance Management",
          "L&D",
          "Succession Planning",
          "Employee Relations",
        ],
      },
      {
        group: "Compliance",
        skills: [
          "Employment Law",
          "GDPR",
          "Diversity & Inclusion",
          "Workplace Investigations",
        ],
      },
    ],
    titles: [
      "HR Manager",
      "Talent Acquisition Manager",
      "People Operations Manager",
      "HR Business Partner",
    ],
    industries: ["Tech", "Finance", "Healthcare", "Retail"],
    certs: ["CIPD Level 5/7", "SHRM-CP", "PHR"],
    edu: ["MSc Human Resource Management", "B.A. Business Administration"],
    bullets: (role) => [
      `Led recruitment for ${faker.number.int({ min: 10, max: 200 })} roles across EMEA/US, reducing time-to-hire by ${faker.number.int({ min: 10, max: 40 })}%.`,
      `Implemented a performance review program which improved engagement scores by ${faker.number.int({ min: 5, max: 20 })} points.`,
      `Rolled out benefits and L&D programs that increased retention in key teams by ${faker.number.int({ min: 5, max: 25 })}%.`,
      `Managed complex employee relations issues and maintained compliance with local employment law.`,
    ],
  },

  // add more professions here following same pattern...
  // manager, athlete, designer, doctor, lawyer, salesperson, data_scientist...
};

// if user filtered professions, keep only allowed ones
const availableProfessions = PROF_FILTER
  ? Object.fromEntries(
      Object.entries(professionCatalog).filter(([k]) =>
        PROF_FILTER.includes(k),
      ),
    )
  : professionCatalog;

const professionKeys = Object.keys(availableProfessions);
if (professionKeys.length === 0) {
  console.error(
    "No valid professions selected. Available:",
    Object.keys(professionCatalog).join(", "),
  );
  process.exit(1);
}

// ========== GENERATION LOGIC ==========

function randomDateRange(pastYears = 10) {
  const start = faker.date.past({ years: pastYears });
  // end is either recent or present
  const end = chance(70)
    ? faker.date.between({ from: start, to: new Date() })
    : null;
  return { start, end };
}

function formatDate(date, style) {
  if (!date) return "Present";
  // style variations
  switch (style) {
    case 0:
      return date.toLocaleString("en-US", { month: "short", year: "numeric" }); // Jan 2020
    case 1:
      return date.getFullYear().toString(); // 2020
    case 2:
      return date.toISOString().slice(0, 10); // 2020-01-01
    default:
      return date.toLocaleString("en-GB", { month: "short", year: "numeric" }); // Jan 2020
  }
}

function maybeOmit(sectionName) {
  // Omit occasionally: education/certs/projects/etc
  const odds = {
    education: 10,
    certifications: 20,
    projects: 30,
    summary: 5,
  };
  const p = odds[sectionName] || 10;
  return chance(p);
}

// creates a structured CV object (ground truth)
function generateStructuredCV(profKey) {
  const prof = availableProfessions[profKey];
  const first = faker.person.firstName();
  const last = faker.person.lastName();
  const fullName = `${first} ${last}`;
  // some user avatars or fake photos (omit for ATS)
  const email = faker.internet
    .email({ firstName: first, lastName: last })
    .toLowerCase();
  const phone = faker.phone.number("+1 ### ### ####");
  const location = `${faker.location.city()}, ${faker.location.country()}`;
  const linkedin = `https://linkedin.com/in/${faker.internet.username({ firstName: first, lastName: last })}`;
  const website = chance(30) ? faker.internet.url() : null;

  // summary
  const summaryTemplates = [
    `Experienced ${prof.display} with ${faker.number.int({ min: 3, max: 15 })}+ years focusing on ${rand(prof.industries)}. Known for ${rand(["delivery", "leadership", "operational excellence", "quality engineering", "menu innovation", "people development"])}.`,
    `${prof.display} with a track record building high-impact solutions and improving ${rand(["KPIs", "guest satisfaction", "retention", "reliability"])}.`,
    `Proven ${prof.display} experienced at scaling teams and processes across ${rand(["startup", "enterprise", "global"])}, comfortable working cross-functionally.`,
  ];
  const summary =
    summaryTemplates[
      faker.number.int({ min: 0, max: summaryTemplates.length - 1 })
    ];

  // skills: pick several from each group but allow large sets
  const skillsGrouped = prof.groups.map((g) => {
    // pick between 2 and all skills in group, but sometimes many skills (huge skillset)
    const pickCount = faker.number.int({
      min: 1,
      max: Math.min(
        g.skills.length,
        chance(40) ? g.skills.length : Math.min(4, g.skills.length),
      ),
    });
    const choices = faker.helpers.arrayElements(g.skills, pickCount);
    return { group: g.group, skills: choices };
  });

  // experience: 2-6 experiences, but match titles from prof.titles
  const expCount = faker.number.int({ min: 2, max: 5 });
  const experience = Array.from({ length: expCount }).map(() => {
    const title = rand(prof.titles);
    const company = faker.company.name();
    const period = randomDateRange(12);
    // produce 2-5 bullets using profession-specific generator
    const bullets = faker.helpers
      .arrayElements(
        prof.bullets(title),
        faker.number.int({
          min: 2,
          max: Math.min(4, prof.bullets(title).length),
        }),
      )
      .map((b) => b);
    return {
      title,
      company,
      start: period.start,
      end: period.end,
      bullets,
    };
  });

  // education (sometimes omitted)
  const education = maybeOmit("education")
    ? []
    : [
        {
          degree: rand(prof.edu),
          school: `${faker.company.name()} ${rand(["University", "Institute", "College"])}`,
          year: faker.date.past({ years: 15 }).getFullYear(),
        },
      ];

  const certifications = maybeOmit("certifications")
    ? []
    : faker.helpers.arrayElements(
        prof.certs,
        faker.number.int({ min: 0, max: prof.certs.length }),
      );

  // projects: small list, optional
  const projects = maybeOmit("projects")
    ? []
    : Array.from({ length: faker.number.int({ min: 0, max: 3 }) }).map(() => ({
        name: faker.lorem.words(faker.number.int({ min: 1, max: 3 })),
        description: faker.company.catchPhrase(),
        link: chance(40) ? faker.internet.url() : null,
      }));

  // contact confirmations / references sometimes present
  const references = chance(30)
    ? [
        {
          name: `${faker.person.firstName()} ${faker.person.lastName()}`,
          title: rand(["Manager", "Director", "VP", "Executive"]),
          contact: faker.internet.email(),
        },
      ]
    : [];

  // add noise/typos optionally - small function to introduce a small misspelling
  function maybeNoisy(s) {
    if (!NOISE) return s;
    if (!chance(10)) return s;
    // introduce small typo by swapping two chars
    const i = faker.number.int({ min: 1, max: Math.max(1, s.length - 2) });
    const arr = s.split("");
    const tmp = arr[i];
    arr[i] = arr[i + 1] || arr[i];
    arr[i + 1] = tmp;
    return arr.join("");
  }

  return {
    id: `cv_${Date.now()}_${faker.string.alphanumeric(6)}`,
    createdAt: new Date().toISOString(),
    profession: profKey,
    name: maybeNoisy(fullName),
    personal: {
      email: email,
      phone,
      location,
      linkedin,
      website,
    },
    summary: maybeNoisy(summary),
    skillsGrouped,
    experience,
    education,
    certifications,
    projects,
    references,
  };
}

// ========== HTML TEMPLATES (varied) ==========
function renderHtmlFromCV(cv, templateVariant = 0, headingSynonyms = {}) {
  // templateVariant: 0 = classic, 1 = modern compact, 2 = two-column-ish (still single column for ATS)
  const headings = {
    summary:
      headingSynonyms.summary ||
      rand(["PROFESSIONAL SUMMARY", "SUMMARY", "PROFILE"]),
    skills:
      headingSynonyms.skills ||
      rand(["SKILLS", "CORE SKILLS", "TECHNICAL SKILLS"]),
    experience:
      headingSynonyms.experience ||
      rand(["EXPERIENCE", "WORK EXPERIENCE", "EMPLOYMENT HISTORY"]),
    education:
      headingSynonyms.education || rand(["EDUCATION", "ACADEMIC BACKGROUND"]),
    projects: headingSynonyms.projects || "PROJECTS",
    certifications: headingSynonyms.certifications || "CERTIFICATIONS",
    references: headingSynonyms.references || "REFERENCES",
  };

  // date format style per CV
  const dateStyle = faker.number.int({ min: 0, max: 2 });

  // section ordering variations
  const orderVariants = [
    [
      "summary",
      "skills",
      "experience",
      "education",
      "certifications",
      "projects",
      "references",
    ],
    [
      "summary",
      "experience",
      "skills",
      "education",
      "projects",
      "certifications",
    ],
    [
      "skills",
      "summary",
      "experience",
      "projects",
      "education",
      "certifications",
    ],
  ];
  const order = rand(orderVariants);

  // small CSS should be ATS-friendly
  const styles = `
    body{font-family: Arial, Helvetica, sans-serif; font-size:12px; color:#111; padding:28px;}
    h1{font-size:20px;margin:0;}
    .meta{margin:6px 0 12px 0;font-size:11px;color:#333;}
    h2{font-size:13px;margin:14px 0 6px;border-bottom:1px solid #222;padding-bottom:3px;}
    ul{margin:6px 0 6px 18px;}
    p{margin:6px 0;}
    .skill-group {margin-bottom:6px;}
    .skill-group strong {display:block; font-size:11px;}
  `;

  // helpers
  const formatPeriod = (e) =>
    `${formatDate(e.start, dateStyle)} - ${e.end ? formatDate(e.end, dateStyle) : "Present"}`;

  const sectionsHtml = {
    summary: `<h2>${headings.summary}</h2><p>${cv.summary || ""}</p>`,
    skills: `<h2>${headings.skills}</h2>
      ${cv.skillsGrouped.map((g) => `<div class="skill-group"><strong>${g.group}</strong><div>${g.skills.join(" • ")}</div></div>`).join("")}
    `,
    experience: `<h2>${headings.experience}</h2>
      ${cv.experience
        .map(
          (
            e,
          ) => `<p><strong>${e.title}</strong> — ${e.company} (${formatPeriod(e)})</p>
        <ul>${e.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>`,
        )
        .join("")}
    `,
    education:
      cv.education && cv.education.length
        ? `<h2>${headings.education}</h2>${cv.education.map((ed) => `<p>${ed.degree}, ${ed.school} (${ed.year})</p>`).join("")}`
        : "",
    certifications:
      cv.certifications && cv.certifications.length
        ? `<h2>${headings.certifications}</h2><ul>${cv.certifications.map((c) => `<li>${c}</li>`).join("")}</ul>`
        : "",
    projects:
      cv.projects && cv.projects.length
        ? `<h2>${headings.projects}</h2>${cv.projects.map((p) => `<p><strong>${p.name}</strong> - ${p.description}${p.link ? ` <a href="${p.link}">${p.link}</a>` : ""}</p>`).join("")}`
        : "",
    references:
      cv.references && cv.references.length
        ? `<h2>${headings.references}</h2>${cv.references.map((r) => `<p>${r.name} — ${r.title} — ${r.contact}</p>`).join("")}`
        : "",
  };

  // generate final HTML with chosen order
  const orderedHtml = order.map((k) => sectionsHtml[k] || "").join("\n");

  const headerHtml = `<h1>${cv.name}</h1>
    <div class="meta">${cv.personal.email} | ${cv.personal.phone} ${cv.personal.location ? `| ${cv.personal.location}` : ""} ${cv.personal.linkedin ? `| ${cv.personal.linkedin}` : ""}</div>`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>${styles}</style></head><body>${headerHtml}${orderedHtml}</body></html>`;
}

// ========== EMAIL TEMPLATE GENERATION ==========
function generateEmailForCV(cv) {
  // multiple templates: short outreach, formal cover, casual follow-up
  const templates = [
    {
      name: "short_outreach",
      subject: `Application: ${cv.name} — ${rand(["Open to new roles", "Available immediately", "Experienced " + availableProfessions[cv.profession].display])}`,
      body: `Hi ${faker.person.firstName()},\n\nMy name is ${cv.name}. I'm an experienced ${availableProfessions[cv.profession].display} based in ${cv.personal.location || "remote"}. I have ${faker.number.int({ min: 3, max: 15 })}+ years working in ${rand(availableProfessions[cv.profession].industries)}. Attached is my CV — I'd love to discuss opportunities at your team.\n\nBest,\n${cv.name}\n${cv.personal.email} | ${cv.personal.phone}`,
    },
    {
      name: "formal_cover",
      subject: `Candidate: ${cv.name} — ${availableProfessions[cv.profession].display}`,
      body: `Dear Hiring Team,\n\nI am writing to express interest in roles aligned with my background as a ${availableProfessions[cv.profession].display}. ${cv.summary || ""}\n\nKey highlights:\n- ${cv.skillsGrouped
        .map((g) => g.skills.slice(0, 2))
        .flat()
        .join(
          "\n- ",
        )}\n\nI would welcome the opportunity to speak further.\n\nSincerely,\n${cv.name}\n${cv.personal.linkedin || ""}`,
    },
    {
      name: "casual_followup",
      subject: `${cv.name} — follow up on application`,
      body: `Hello,\n\nJust checking in — I applied recently and wanted to re-share my CV. I'm currently available and keen to contribute as a ${availableProfessions[cv.profession].display}.\n\nThanks,\n${cv.name}`,
    },
  ];

  // sometimes omit subject or website to create edge cases
  const t = rand(templates);
  if (chance(8)) t.subject = "";
  if (chance(12)) t.body = t.body.replace(/\n{2,}/g, "\n"); // compress spacing
  return t;
}

// ========== FILE OUTPUT & PDF GENERATION ==========
async function saveJson(cv, outDir, index) {
  const fname = path.join(outDir, `${index}_${cv.id}.json`);
  await fs.promises.writeFile(fname, JSON.stringify(cv, null, 2), "utf8");
  return fname;
}

async function savePdfFromHtml(html, outPath, browser) {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  // PDF options: simple, A4
  await page.pdf({
    path: outPath,
    format: "A4",
    printBackground: false,
    margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" },
  });
  await page.close();
}

async function generateBatch(startIndex, endIndex, browser) {
  for (let i = startIndex; i <= endIndex; i++) {
    const profKey = rand(professionKeys);
    const cv = generateStructuredCV(profKey);
    const templateVariant = faker.number.int({ min: 0, max: 2 });
    const headingSynonyms = {}; // we already vary headings internally
    const html = renderHtmlFromCV(cv, templateVariant, headingSynonyms);

    const index = String(i).padStart(4, "0");
    const pdfPath = path.join(OUT_DIR, `${index}_${cv.id}.pdf`);
    const jsonPath = path.join(OUT_DIR, `${index}_${cv.id}.json`);

    const email = generateEmailForCV(cv);

    // Save JSON ground truth (including email template for convenience)
    if (GENERATE_JSON) {
      await fs.promises.writeFile(
        jsonPath,
        JSON.stringify({ cv, email }, null, 2),
        "utf8",
      );
    }

    // Save PDF
    if (GENERATE_PDF) {
      await savePdfFromHtml(html, pdfPath, browser);
    }

    // Add an index row
    indexRows.push({
      index,
      id: cv.id,
      name: cv.name,
      profession: cv.profession,
      email: cv.personal.email,
      phone: cv.personal.phone,
      pdf: GENERATE_PDF ? pdfPath : "",
      json: GENERATE_JSON ? jsonPath : "",
    });

    if (i % 10 === 0)
      console.log(
        `Generated ${i - startIndex + 1} items in batch (global index ${i})`,
      );
  }
}

// ========== MAIN ==========
const indexRows = [];
(async () => {
  console.log(
    "Starting generation:",
    COUNT,
    "CV(s). Professions:",
    professionKeys.join(", "),
  );
  // create CSV index writer
  const csvWriter = createCsvWriter({
    path: path.join(OUT_DIR, "index.csv"),
    header: [
      { id: "index", title: "index" },
      { id: "id", title: "id" },
      { id: "name", title: "name" },
      { id: "profession", title: "profession" },
      { id: "email", title: "email" },
      { id: "phone", title: "phone" },
      { id: "pdf", title: "pdf" },
      { id: "json", title: "json" },
    ],
  });

  // for scale: split into concurrency batches
  const batchSize = Math.ceil(COUNT / CONCURRENCY);
  const browserInstances = [];
  try {
    for (let b = 0; b < CONCURRENCY; b++) {
      // open a browser per worker to reduce memory spikes
      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: "chrome",
        protocolTimeout: 0,
      });
      browserInstances.push(browser);
    }

    const promises = [];
    let globalIndex = 1;
    for (let b = 0; b < CONCURRENCY; b++) {
      const start = globalIndex;
      let end = Math.min(COUNT, start + batchSize - 1);
      globalIndex = end + 1;
      const browser = browserInstances[b];
      promises.push(
        (async () => {
          await generateBatch(start, end, browser);
        })(),
      );
      if (globalIndex > COUNT) break;
    }

    await Promise.all(promises);
  } finally {
    // close browsers
    await Promise.all(browserInstances.map((b) => b.close().catch(() => {})));
  }

  // save index CSV
  await csvWriter.writeRecords(indexRows);
  console.log("Done. Files in:", OUT_DIR);
})().catch((err) => {
  console.error("Generation failed:", err);
  process.exit(1);
});
