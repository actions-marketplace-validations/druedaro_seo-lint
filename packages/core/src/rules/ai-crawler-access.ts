import type { Rule, RuleContext, Finding, RuleMeta } from "../types.js";

const meta: RuleMeta = {
  id: "ai-crawler-access",
  severity: "warning",
  category: "geo",
  description: "robots.txt should not unintentionally block major AI search crawlers",
  docsUrl: "https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers",
};

const KNOWN_AI_CRAWLERS = [
  "gptbot",
  "claudebot",
  "perplexitybot",
  "google-extended",
  "amazonbot",
  "applebot-extended",
  "bytespider",
  "chatgpt-user",
];

interface AgentRules {
  agents: string[];
  disallow: string[];
}

function parseRobots(content: string): AgentRules[] {
  const sections: AgentRules[] = [];
  let currentAgents: string[] = [];
  let currentDisallows: string[] = [];

  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.split("#")[0]?.trim();
    if (!line) continue;

    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim().toLowerCase();
    const val = line.slice(colonIdx + 1).trim();

    if (key === "user-agent") {
      if (currentDisallows.length > 0) {
        sections.push({ agents: currentAgents, disallow: currentDisallows });
        currentAgents = [];
        currentDisallows = [];
      }
      currentAgents.push(val.toLowerCase());
    } else if (key === "disallow") {
      if (val) currentDisallows.push(val);
    }
  }

  if (currentAgents.length > 0) {
    sections.push({ agents: currentAgents, disallow: currentDisallows });
  }

  return sections;
}

function check(_: any, ctx: RuleContext): Finding[] {
  const findings: Finding[] = [];
  if (!ctx.getFileContent) return findings;

  const content = ctx.getFileContent("robots.txt") ?? ctx.getFileContent("/robots.txt");
  if (!content) return findings;

  const sections = parseRobots(content);

  for (const section of sections) {
    const isBlockingRoot = section.disallow.some((d) => d === "/" || d === "/*");
    if (!isBlockingRoot) continue;

    for (const agent of section.agents) {
      if (agent === "*") {
        findings.push({
          ruleId: meta.id,
          severity: meta.severity,
          category: meta.category,
          message: 'robots.txt blocks all crawlers with "Disallow: /", which prevents AI search engine indexing.',
          filePath: "robots.txt",
        });
      } else if (KNOWN_AI_CRAWLERS.includes(agent)) {
        findings.push({
          ruleId: meta.id,
          severity: meta.severity,
          category: meta.category,
          message: `robots.txt explicitly blocks AI crawler "${agent}". Verify this is intentional for GEO.`,
          filePath: "robots.txt",
        });
      }
    }
  }

  return findings;
}

export const aiCrawlerAccess: Rule = {
  meta,
  appliesTo(ctx: RuleContext): boolean {
    return !ctx.allFiles.length || ctx.filePath === ctx.allFiles[0];
  },
  check,
};
